const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ubuntu 24 服务器配置
const SSH = {
  host: '192.168.1.5',
  port: 22,
  username: 'renpengfei',
  password: '123456'
};

function run(conn, cmd, ms = 60000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Timeout: ' + cmd.slice(0, 50))), ms);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(t); return reject(err); }
      let out = '';
      stream.on('close', () => { clearTimeout(t); resolve(out); })
        .on('data', d => { out += d; process.stdout.write(d); })
        .stderr.on('data', d => { out += d; process.stderr.write(d); });
    });
  });
}

function upload(conn, src, dst) {
  return new Promise((res, rej) => {
    conn.sftp((err, sftp) => {
      if (err) return rej(err);
      sftp.fastPut(src, dst, err => {
        if (err) return rej(err);
        console.log('OK:', dst);
        res();
      });
    });
  });
}

async function main() {
  const c = new Client();
  console.log('Connecting to Ubuntu 24 server...');
  await new Promise((r, e) => c.on('ready', r).on('error', e).connect(SSH));
  console.log('Connected!');

  const sudo = 'echo ' + SSH.password + ' | sudo -S ';

  try {
    // 步骤1: 检查并安装依赖
    console.log('\n=== Step 1: Check services ===');
    await run(c, sudo + 'systemctl is-active postgresql redis-server', 10000);

    // 步骤2: 创建压缩包
    console.log('\n=== Step 2: Creating deployment package ===');
    const tmpDir = 'f:/uniapp-project/deploy/tmp';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // 复制 server 文件到临时目录
    const serverTmp = tmpDir + '/server';
    if (fs.existsSync(serverTmp)) execSync('rm -rf "' + serverTmp + '"');
    fs.mkdirSync(serverTmp + '/dist', { recursive: true });
    fs.mkdirSync(serverTmp + '/migrations', { recursive: true });

    // 复制必要文件
    fs.copyFileSync('f:/uniapp-project/server/package.json', serverTmp + '/package.json');
    fs.copyFileSync('f:/uniapp-project/server/package-lock.json', serverTmp + '/package-lock.json');
    execSync('cp -r "f:/uniapp-project/server/dist/"* "' + serverTmp + '/dist/"');
    execSync('cp -r "f:/uniapp-project/server/migrations/"* "' + serverTmp + '/migrations/"');

    // 创建压缩包
    console.log('Creating tar.gz...');
    execSync('cd "' + tmpDir + '" && tar -czf deploy.tar.gz server', { stdio: 'inherit' });
    console.log('Package created: ' + tmpDir + '/deploy.tar.gz');

    // 步骤3: 上传压缩包
    console.log('\n=== Step 3: Uploading package ===');
    await run(c, sudo + 'rm -rf /opt/vc', 10000);
    await run(c, sudo + 'mkdir -p /opt/vc', 10000);
    await run(c, sudo + 'chown -R renpengfei:renpengfei /opt/vc', 10000);
    await upload(c, tmpDir + '/deploy.tar.gz', '/tmp/deploy.tar.gz');

    // 步骤4: 解压并安装
    console.log('\n=== Step 4: Extracting and installing ===');
    await run(c, 'cd /opt/vc && tar -xzf /tmp/deploy.tar.gz --strip-components=1', 30000);
    await run(c, 'cd /opt/vc && npm install --production --registry=https://registry.npmmirror.com', 180000);

    // 步骤5: 运行数据库迁移
    console.log('\n=== Step 5: Running migrations ===');
    const migrateScript = `
const pg = require('pg');
const fs = require('fs');
(async () => {
  const pool = new pg.Pool({ host: '127.0.0.1', database: 'virtual_class', user: 'vcuser', password: 'vcpass123' });
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
        console.log('OK:', f);
      } catch (e) { console.log('FAIL:', f, e.message); }
    }
  }
  client.release();
  process.exit(0);
})()`;
    fs.writeFileSync(tmpDir + '/migrate.js', migrateScript);
    await upload(c, tmpDir + '/migrate.js', '/opt/vc/migrate.js');
    await run(c, 'cd /opt/vc && node migrate.js', 60000);

    // 步骤6: 安装 PM2 并启动服务
    console.log('\n=== Step 6: Starting server with PM2 ===');
    await run(c, sudo + 'npm install -g pm2 --registry=https://registry.npmmirror.com', 60000);
    await run(c, 'pm2 delete vc 2>/dev/null || true', 10000);
    await run(c, 'cd /opt/vc && pm2 start dist/server.js --name vc', 30000);
    await run(c, 'pm2 save', 10000);

    // 步骤7: 配置 PM2 开机启动
    console.log('\n=== Step 7: Configuring PM2 startup ===');
    const startupOut = await run(c, 'pm2 startup', 10000);
    const cmdMatch = startupOut.match(/sudo\s+.+/g);
    if (cmdMatch && cmdMatch[0]) {
      await run(c, sudo + cmdMatch[0].replace('sudo ', ''), 30000);
    }

    // 步骤8: 验证服务
    console.log('\n=== Step 8: Verifying ===');
    await run(c, 'sleep 2 && curl -s http://localhost:3000/health || echo "Checking port..."', 15000);
    await run(c, 'pm2 status', 10000);

    // 打开防火墙端口
    await run(c, sudo + 'ufw allow 3000/tcp 2>/dev/null || true', 10000);

    console.log('\n' + '='.repeat(50));
    console.log('DEPLOYMENT COMPLETE!');
    console.log('Backend API: http://192.168.1.5:3000');
    console.log('='.repeat(50));

    // 清理临时文件
    execSync('rm -rf "' + tmpDir + '"', { stdio: 'inherit' });

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    c.end();
  }
}

main();
