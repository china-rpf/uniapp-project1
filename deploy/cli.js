#!/usr/bin/env node
/**
 * 统一部署工具 CLI
 *
 * 用法:
 *   node cli.js <command> [options]
 *
 * 命令:
 *   deploy:backend   部署后端服务
 *   deploy:frontend  部署前端服务
 *   deploy:all       部署前后端服务
 *   status           查看服务状态
 *   logs             查看后端日志
 *   restart          重启后端服务
 *   setup            初始化服务器环境
 *
 * 选项:
 *   -e, --env        指定环境 (production/staging), 默认 production
 *   -c, --config     指定配置文件路径
 *   -h, --help       显示帮助信息
 */

const fs = require('fs');
const path = require('path');
const SSHManager = require('./lib/ssh');
const BackendDeployer = require('./lib/backend-deployer');
const FrontendDeployer = require('./lib/frontend-deployer');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    command: args[0] || 'help',
    env: 'production',
    config: null
  };

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === '-e' || args[i] === '--env') && args[i + 1]) {
      result.env = args[i + 1];
      i++;
    } else if ((args[i] === '-c' || args[i] === '--config') && args[i + 1]) {
      result.config = args[i + 1];
      i++;
    } else if (args[i] === '-h' || args[i] === '--help') {
      result.command = 'help';
    }
  }

  return result;
}

// 加载配置
function loadConfig(env, configPath) {
  const configDir = configPath || path.join(__dirname, 'config.json');
  const examplePath = path.join(__dirname, 'config.example.json');

  if (!fs.existsSync(configDir)) {
    console.error(`配置文件不存在: ${configDir}`);
    console.error(`请复制 config.example.json 为 config.json 并修改配置`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configDir, 'utf8'));

  if (!config.servers[env]) {
    console.error(`环境 "${env}" 未在配置文件中定义`);
    console.error(`可用环境: ${Object.keys(config.servers).join(', ')}`);
    process.exit(1);
  }

  return config;
}

// 显示帮助
function showHelp() {
  console.log(`
统一部署工具

用法:
  node cli.js <command> [options]

命令:
  push             智能部署 (自动检测变更，只部署修改的部分)
  push:backend     强制推送后端
  push:frontend    强制推送前端
  deploy:backend   部署后端服务 (Node.js + PM2)
  deploy:frontend  部署前端服务 (Nginx)
  deploy:all       部署前后端服务
  status           查看服务状态
  logs             查看后端日志
  restart          重启后端服务
  stop             停止后端服务
  setup            初始化服务器环境

选项:
  -e, --env        指定环境 (production/staging), 默认 production
  -c, --config     指定配置文件路径
  -h, --help       显示帮助信息

示例:
  node cli.js push              # 智能部署 (推荐)
  node cli.js push:backend      # 强制推送后端
  node cli.js deploy:all        # 完整部署
  node cli.js status            # 查看状态

配置:
  1. 复制 config.example.json 为 config.json
  2. 修改 config.json 中的服务器信息和项目配置
`);
}

// 部署后端
async function deployBackend(config, serverConfig) {
  const deployer = new BackendDeployer(config, serverConfig);
  await deployer.deploy();
}

// 部署前端
async function deployFrontend(config, serverConfig) {
  const deployer = new FrontendDeployer(config, serverConfig);
  await deployer.connect();
  try {
    await deployer.deploy();
  } finally {
    deployer.disconnect();
  }
}

// 部署全部
async function deployAll(config, serverConfig) {
  await deployBackend(config, serverConfig);
  await deployFrontend(config, serverConfig);

  console.log('\n' + '='.repeat(50));
  console.log('  部署完成!');
  console.log('='.repeat(50));
  console.log(`  前端: http://${serverConfig.host}`);
  console.log(`  后端: http://${serverConfig.host}:${config.backend.port}`);
  console.log(`  API:  http://${serverConfig.host}/api`);
  console.log('='.repeat(50));
}

// 查看状态
async function showStatus(config, serverConfig) {
  const ssh = new SSHManager(serverConfig);

  try {
    await ssh.connect();

    console.log('\n=== 服务状态 ===\n');

    console.log('1. PostgreSQL:');
    const pg = await ssh.run('systemctl is-active postgresql');
    console.log(`   ${pg.stdout.trim()}`);

    console.log('2. Redis:');
    const redis = await ssh.run('systemctl is-active redis-server 2>/dev/null || systemctl is-active redis');
    console.log(`   ${redis.stdout.trim()}`);

    console.log('3. Node.js 服务 (PM2):');
    await ssh.run('pm2 status');

    console.log('4. Nginx:');
    const nginx = await ssh.run('systemctl is-active nginx');
    console.log(`   ${nginx.stdout.trim()}`);

    console.log('5. 后端健康检查:');
    const health = await ssh.run(`curl -s http://localhost:${config.backend.port}/health`);
    console.log(`   ${health.stdout.trim()}`);

    console.log('\n=== 访问地址 ===');
    console.log(`  前端: http://${serverConfig.host}`);
    console.log(`  后端: http://${serverConfig.host}:${config.backend.port}`);
    console.log(`  API:  http://${serverConfig.host}/api`);

  } finally {
    ssh.disconnect();
  }
}

// 查看日志
async function showLogs(config, serverConfig) {
  const ssh = new SSHManager(serverConfig);

  try {
    await ssh.connect();
    console.log('\n=== 后端日志 (最近50行) ===\n');
    await ssh.run(`pm2 logs ${config.backend.appName} --lines 50 --nostream`);
  } finally {
    ssh.disconnect();
  }
}

// 重启服务
async function restartService(config, serverConfig) {
  const ssh = new SSHManager(serverConfig);

  try {
    await ssh.connect();
    console.log('\n=== 重启后端服务 ===\n');
    await ssh.run(`pm2 restart ${config.backend.appName}`);
    await ssh.run('pm2 save');
    console.log('✓ 服务已重启');
  } finally {
    ssh.disconnect();
  }
}

// 停止服务
async function stopService(config, serverConfig) {
  const ssh = new SSHManager(serverConfig);

  try {
    await ssh.connect();
    console.log('\n=== 停止后端服务 ===\n');
    await ssh.run(`pm2 stop ${config.backend.appName}`);
    console.log('✓ 服务已停止');
  } finally {
    ssh.disconnect();
  }
}

// 智能推送：检测变更并只部署修改的部分
async function smartPush(config, serverConfig, forceBackend = false, forceFrontend = false) {
  console.log('\n=== 智能部署检测 ===\n');

  const projectRoot = path.join(__dirname, '..');
  const serverDir = path.join(projectRoot, 'server');
  const clientDir = path.join(projectRoot, 'client');
  const deployRecord = path.join(__dirname, '.deploy-record.json');

  // 读取部署记录
  let record = { lastBackend: 0, lastFrontend: 0 };
  if (fs.existsSync(deployRecord)) {
    record = JSON.parse(fs.readFileSync(deployRecord, 'utf8'));
  }

  // 获取目录最后修改时间
  function getDirMtime(dir, subDir = '') {
    const targetDir = subDir ? path.join(dir, subDir) : dir;
    if (!fs.existsSync(targetDir)) return 0;

    let maxTime = 0;
    const files = fs.readdirSync(targetDir, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(targetDir, file.name);
      if (file.isDirectory()) {
        maxTime = Math.max(maxTime, getDirMtime(filePath));
      } else {
        const stat = fs.statSync(filePath);
        maxTime = Math.max(maxTime, stat.mtimeMs);
      }
    }
    return maxTime;
  }

  // 检测后端变更
  const backendMtime = Math.max(
    getDirMtime(serverDir, 'dist'),
    getDirMtime(serverDir, 'migrations')
  );
  const backendChanged = forceBackend || backendMtime > record.lastBackend;

  // 检测前端变更
  const frontendMtime = getDirMtime(clientDir, 'dist');
  const frontendChanged = forceFrontend || frontendMtime > record.lastFrontend;

  // 显示检测结果
  const formatTime = (ms) => ms ? new Date(ms).toLocaleString() : '从未';
  console.log(`后端代码: ${backendChanged ? '✓ 有变更' : '○ 无变更'} (最后修改: ${formatTime(backendMtime)})`);
  console.log(`前端代码: ${frontendChanged ? '✓ 有变更' : '○ 无变更'} (最后修改: ${formatTime(frontendMtime)})`);
  console.log('');

  // 决定部署策略
  if (!backendChanged && !frontendChanged) {
    console.log('没有检测到代码变更。');
    console.log('如需强制部署，请使用:');
    console.log('  /push-backend  - 强制部署后端');
    console.log('  /push-frontend - 强制部署前端');
    console.log('  /deploy        - 强制部署全部');
    return;
  }

  const now = Date.now();
  const actions = [];

  if (backendChanged) {
    console.log('>>> 部署后端...\n');
    await deployBackend(config, serverConfig);
    record.lastBackend = now;
    actions.push('后端');
  }

  if (frontendChanged) {
    console.log('\n>>> 部署前端...\n');
    await deployFrontend(config, serverConfig);
    record.lastFrontend = now;
    actions.push('前端');
  }

  // 保存部署记录
  fs.writeFileSync(deployRecord, JSON.stringify(record, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log(`  部署完成! (已更新: ${actions.join(' + ')})`);
  console.log('='.repeat(50));
  console.log(`  前端: http://${serverConfig.host}`);
  console.log(`  后端: http://${serverConfig.host}:${config.backend.port}`);
  console.log('='.repeat(50));
}

// 初始化服务器
async function setupServer(config, serverConfig) {
  console.log('\n=== 初始化服务器环境 ===\n');

  const ssh = new SSHManager(serverConfig);

  try {
    await ssh.connect();

    const isUbuntu = serverConfig.os === 'ubuntu';
    const pkgMgr = isUbuntu ? 'apt-get' : 'yum';

    console.log('1. 更新系统...');
    await ssh.sudo(`${pkgMgr} update -y`);

    console.log('2. 安装基础工具...');
    await ssh.sudo(`${pkgMgr} install -y curl wget git unzip`);

    console.log('3. 安装 Node.js...');
    if (isUbuntu) {
      await ssh.run('curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -');
      await ssh.sudo('apt-get install -y nodejs');
      await ssh.sudo('apt-get install -y npm');
    } else {
      await ssh.sudo('yum install -y nodejs npm');
    }

    console.log('4. 安装 PM2...');
    await ssh.sudo('npm install -g pm2 --registry=https://registry.npmmirror.com');

    console.log('5. 安装 PostgreSQL...');
    if (isUbuntu) {
      await ssh.sudo('apt-get install -y postgresql postgresql-contrib');
      await ssh.sudo('systemctl start postgresql');
      await ssh.sudo('systemctl enable postgresql');
    } else {
      await ssh.sudo('yum install -y postgresql-server postgresql');
      await ssh.sudo('postgresql-setup initdb 2>/dev/null || true');
      await ssh.sudo('systemctl start postgresql');
      await ssh.sudo('systemctl enable postgresql');
    }

    console.log('6. 安装 Redis...');
    if (isUbuntu) {
      await ssh.sudo('apt-get install -y redis-server');
      await ssh.sudo('systemctl start redis-server');
      await ssh.sudo('systemctl enable redis-server');
    } else {
      await ssh.sudo('yum install -y redis');
      await ssh.sudo('systemctl start redis');
      await ssh.sudo('systemctl enable redis');
    }

    console.log('7. 安装 Nginx...');
    await ssh.sudo(`${pkgMgr} install -y nginx`);
    await ssh.sudo('systemctl start nginx');
    await ssh.sudo('systemctl enable nginx');

    console.log('\n✓ 服务器环境初始化完成!');

  } finally {
    ssh.disconnect();
  }
}

// 主函数
async function main() {
  const args = parseArgs();

  if (args.command === 'help') {
    showHelp();
    return;
  }

  const config = loadConfig(args.env, args.config);
  const serverConfig = config.servers[args.env];

  console.log(`\n目标服务器: ${serverConfig.host} (${serverConfig.os || 'ubuntu'})`);
  console.log(`环境: ${args.env}\n`);

  try {
    switch (args.command) {
      case 'push':
        await smartPush(config, serverConfig);
        break;

      case 'push:backend':
        await smartPush(config, serverConfig, true, false);
        break;

      case 'push:frontend':
        await smartPush(config, serverConfig, false, true);
        break;

      case 'deploy:backend':
        await deployBackend(config, serverConfig);
        break;

      case 'deploy:frontend':
        await deployFrontend(config, serverConfig);
        break;

      case 'deploy:all':
        await deployAll(config, serverConfig);
        break;

      case 'status':
        await showStatus(config, serverConfig);
        break;

      case 'logs':
        await showLogs(config, serverConfig);
        break;

      case 'restart':
        await restartService(config, serverConfig);
        break;

      case 'stop':
        await stopService(config, serverConfig);
        break;

      case 'setup':
        await setupServer(config, serverConfig);
        break;

      default:
        console.error(`未知命令: ${args.command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ 部署失败:', error.message);
    process.exit(1);
  }
}

main();
