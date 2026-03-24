/**
 * 后端部署器
 */
const fs = require('fs');
const path = require('path');
const BaseDeployer = require('./deployer');

class BackendDeployer extends BaseDeployer {
  constructor(config, serverConfig) {
    super(config, serverConfig);
    this.backendConfig = config.backend;
    this.dbConfig = config.database;
  }

  /**
   * 部署后端服务
   */
  async deploy() {
    console.log('\n' + '='.repeat(50));
    console.log('开始部署后端服务');
    console.log('='.repeat(50));

    try {
      await this.connect();

      // 1. 安装依赖
      await this.installDependencies();

      // 2. 上传代码
      await this.uploadCode();

      // 3. 安装 npm 包
      await this.installPackages();

      // 4. 运行数据库迁移
      await this.runMigrations();

      // 5. 启动服务
      await this.startService();

      // 6. 验证
      await this.verify();

      console.log('\n✓ 后端部署完成!');
      console.log(`  API: http://${this.serverConfig.host}:${this.backendConfig.port}`);

    } finally {
      this.disconnect();
    }
  }

  /**
   * 安装系统依赖
   */
  async installDependencies() {
    console.log('\n>>> 检查系统依赖...');

    const { os } = this.serverConfig;
    const isUbuntu = os === 'ubuntu';

    // 检查服务状态
    const checkPg = await this.ssh.run('systemctl is-active postgresql || echo inactive');
    const checkRedis = await this.ssh.run('systemctl is-active redis-server || systemctl is-active redis || echo inactive');

    if (checkPg.stdout.includes('inactive')) {
      console.log('安装 PostgreSQL...');
      if (isUbuntu) {
        await this.ssh.sudo('apt-get update');
        await this.ssh.sudo('DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib');
        await this.ssh.sudo('systemctl start postgresql');
        await this.ssh.sudo('systemctl enable postgresql');
      } else {
        await this.ssh.sudo('yum install -y postgresql-server postgresql');
        await this.ssh.sudo('postgresql-setup initdb 2>/dev/null || true');
        await this.ssh.sudo('systemctl start postgresql');
        await this.ssh.sudo('systemctl enable postgresql');
      }
    }

    if (checkRedis.stdout.includes('inactive')) {
      console.log('安装 Redis...');
      if (isUbuntu) {
        await this.ssh.sudo('apt-get install -y redis-server');
        await this.ssh.sudo('systemctl start redis-server');
        await this.ssh.sudo('systemctl enable redis-server');
      } else {
        await this.ssh.sudo('yum install -y redis');
        await this.ssh.sudo('systemctl start redis');
        await this.ssh.sudo('systemctl enable redis');
      }
    }

    // 设置数据库
    await this.setupDatabase();

    // 检查 Node.js
    const nodeCheck = await this.ssh.run('node --version 2>/dev/null || echo notfound');
    if (nodeCheck.stdout.includes('notfound')) {
      console.log('安装 Node.js...');
      if (isUbuntu) {
        await this.ssh.run('curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -');
        await this.ssh.sudo('apt-get install -y nodejs');
        await this.ssh.sudo('apt-get install -y npm');
      } else {
        await this.ssh.sudo('yum install -y nodejs npm');
      }
    }

    console.log('✓ 系统依赖检查完成');
  }

  /**
   * 设置数据库
   */
  async setupDatabase() {
    console.log('设置数据库...');

    const { name, user, password } = this.dbConfig;

    // 创建用户
    await this.ssh.sudo(`-u postgres psql -c "CREATE USER ${user} WITH PASSWORD '${password}';" 2>/dev/null || true`);

    // 创建数据库
    await this.ssh.sudo(`-u postgres psql -c "CREATE DATABASE ${name} OWNER ${user};" 2>/dev/null || true`);

    // 授权
    await this.ssh.sudo(`-u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${name} TO ${user};"`);

    console.log('✓ 数据库设置完成');
  }

  /**
   * 上传代码
   */
  async uploadCode() {
    console.log('\n>>> 上传代码...');

    this.ensureTmpDir();

    // sourceDir 是相对于 deploy 目录的路径
    const deployDir = path.join(__dirname, '..');
    const sourceDir = path.resolve(deployDir, this.backendConfig.sourceDir);
    const deployPath = this.backendConfig.deployPath;

    // 创建临时目录结构
    const tmpServer = path.join(this.tmpDir, 'server');
    if (fs.existsSync(tmpServer)) fs.rmSync(tmpServer, { recursive: true });
    fs.mkdirSync(tmpServer + '/dist', { recursive: true });
    fs.mkdirSync(tmpServer + '/migrations', { recursive: true });

    // 复制文件
    fs.copyFileSync(path.join(sourceDir, 'package.json'), path.join(tmpServer, 'package.json'));
    if (fs.existsSync(path.join(sourceDir, 'package-lock.json'))) {
      fs.copyFileSync(path.join(sourceDir, 'package-lock.json'), path.join(tmpServer, 'package-lock.json'));
    }

    // 复制 dist 和 migrations
    this.copyDir(path.join(sourceDir, 'dist'), path.join(tmpServer, 'dist'));
    this.copyDir(path.join(sourceDir, 'migrations'), path.join(tmpServer, 'migrations'));

    // 创建压缩包
    const zipPath = path.join(this.tmpDir, 'server.zip');
    this.createZip(tmpServer, zipPath);

    // 准备远程目录
    await this.ssh.sudo(`rm -rf ${deployPath}`);
    await this.ssh.sudo(`mkdir -p ${deployPath}`);
    await this.ssh.sudo(`chown -R ${this.serverConfig.username}:${this.serverConfig.username} ${deployPath}`);

    // 上传
    await this.ssh.upload(zipPath, '/tmp/server.zip');

    // 完全清理部署目录并重新设置权限
    await this.ssh.sudo(`rm -rf ${deployPath}`);
    await this.ssh.sudo(`mkdir -p ${deployPath}`);
    await this.ssh.sudo(`chown -R ${this.serverConfig.username}:${this.serverConfig.username} ${deployPath}`);

    // 安装 unzip 并解压
    await this.ssh.sudo('apt-get install -y unzip 2>/dev/null || yum install -y unzip 2>/dev/null || true');
    await this.ssh.run(`cd ${deployPath} && unzip -o /tmp/server.zip`);

    // 修复目录权限 (解压后的目录可能缺少执行权限)
    await this.ssh.sudo(`chmod -R 755 ${deployPath}/dist ${deployPath}/migrations`);

    console.log('✓ 代码上传完成');
  }

  /**
   * 复制目录
   */
  copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * 安装 npm 包
   */
  async installPackages() {
    console.log('\n>>> 安装依赖包...');

    const deployPath = this.backendConfig.deployPath;
    await this.ssh.run(`cd ${deployPath} && npm install --production --registry=https://registry.npmmirror.com`, 180000);

    console.log('✓ 依赖包安装完成');
  }

  /**
   * 运行数据库迁移
   */
  async runMigrations() {
    console.log('\n>>> 运行数据库迁移...');

    const deployPath = this.backendConfig.deployPath;
    const { host, name, user, password } = this.dbConfig;

    // 创建迁移脚本
    const migrateScript = `
const pg = require('pg');
const fs = require('fs');
(async () => {
  const pool = new pg.Pool({ host: '${host}', database: '${name}', user: '${user}', password: '${password}' });
  const client = await pool.connect();
  await client.query('CREATE TABLE IF NOT EXISTS _migrations(id SERIAL PRIMARY KEY,name VARCHAR(255) UNIQUE,executed_at TIMESTAMPTZ DEFAULT NOW())');
  const files = fs.readdirSync('./migrations').filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const { rows } = await client.query('SELECT id FROM _migrations WHERE name=$1', [f]);
    if (rows.length === 0) {
      const sql = fs.readFileSync('./migrations/' + f, 'utf8');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations(name) VALUES($1)', [f]);
        console.log('✓ 迁移完成:', f);
      } catch (e) { console.log('✗ 迁移失败:', f, e.message); }
    } else {
      console.log('  跳过 (已执行):', f);
    }
  }
  client.release();
  process.exit(0);
})()`;

    const scriptPath = path.join(this.tmpDir, 'migrate.js');
    fs.writeFileSync(scriptPath, migrateScript);
    await this.ssh.upload(scriptPath, `${deployPath}/migrate.js`);
    await this.ssh.run(`cd ${deployPath} && node migrate.js`, 60000);

    console.log('✓ 数据库迁移完成');
  }

  /**
   * 启动服务
   */
  async startService() {
    console.log('\n>>> 启动服务...');

    const deployPath = this.backendConfig.deployPath;
    const appName = this.backendConfig.appName;
    const startCmd = this.backendConfig.startCommand;

    // 安装 PM2
    await this.ssh.sudo('npm install -g pm2 --registry=https://registry.npmmirror.com', 120000);

    // 停止旧服务
    await this.ssh.run(`pm2 delete ${appName} 2>/dev/null || true`);

    // 启动新服务
    await this.ssh.run(`cd ${deployPath} && pm2 start ${startCmd} --name ${appName}`);
    await this.ssh.run('pm2 save');

    // 配置开机启动
    const startupOut = await this.ssh.run('pm2 startup');
    const cmdMatch = startupOut.stdout.match(/sudo\s+.+/g);
    if (cmdMatch && cmdMatch[0]) {
      await this.ssh.sudo(cmdMatch[0].replace('sudo ', ''));
    }

    console.log('✓ 服务启动完成');
  }

  /**
   * 验证部署
   */
  async verify() {
    console.log('\n>>> 验证部署...');

    const port = this.backendConfig.port;

    // 等待服务启动
    await this.ssh.run('sleep 2');

    // 健康检查
    const health = await this.ssh.run(`curl -s http://localhost:${port}/health || echo "failed"`);
    if (health.stdout.includes('ok') || health.stdout.includes('status')) {
      console.log('✓ 健康检查通过');
    } else {
      console.log('⚠ 健康检查失败, 请检查日志');
    }

    // 开放防火墙端口
    await this.ssh.sudo(`ufw allow ${port}/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport ${port} -j ACCEPT 2>/dev/null || true`);

    // 显示状态
    await this.ssh.run('pm2 status');
  }
}

module.exports = BackendDeployer;
