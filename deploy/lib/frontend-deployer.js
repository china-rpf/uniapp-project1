/**
 * 前端部署器
 */
const BaseDeployer = require('./deployer');
const fs = require('fs');
const path = require('path');

class FrontendDeployer extends BaseDeployer {
  constructor(config, ssh) {
    super(config, ssh);
    this.frontendConfig = config.frontend || {};
    this.backendConfig = config.backend || {};
  }

  async deploy() {
    console.log('\n========================================');
    console.log('  前端部署');
    console.log('========================================\n');

    // 1. 安装 Nginx
    await this.installNginx();

    // 2. 打包前端代码
    await this.packageFrontend();

    // 3. 上传代码
    await this.uploadFrontend();

    // 4. 配置 Nginx
    await this.configureNginx();

    // 5. 验证
    await this.verify();
  }

  /**
   * 安装 Nginx
   */
  async installNginx() {
    console.log('\n>>> 检查/安装 Nginx...');

    const isUbuntu = this.serverConfig.os === 'ubuntu';

    // 检查是否已安装
    const check = await this.ssh.run('which nginx || echo notfound');
    if (check.stdout.includes('notfound')) {
      console.log('安装 Nginx...');
      if (isUbuntu) {
        await this.ssh.sudo('apt-get install -y nginx');
      } else {
        await this.ssh.sudo('yum install -y nginx');
      }
    }

    // 启动 Nginx
    await this.ssh.sudo('systemctl start nginx || systemctl start nginx.service');
    await this.ssh.sudo('systemctl enable nginx || systemctl enable nginx.service');

    console.log('✓ Nginx 准备就绪');
  }

  /**
   * 打包前端代码
   */
  async packageFrontend() {
    console.log('\n>>> 打包前端代码...');

    // sourceDir 是相对于 deploy 目录的路径
    const deployDir = path.join(__dirname, '..');
    const sourceDir = path.resolve(deployDir, this.frontendConfig.sourceDir || '../client');
    // uni-app H5 构建产物在 dist/build/h5 目录
    const distDir = path.join(sourceDir, 'dist/build/h5');

    if (!fs.existsSync(distDir)) {
      throw new Error(`构建产物目录不存在: ${distDir}\n请先运行 npm run build`);
    }

    // 创建压缩包
    const outputPath = path.join(this.tmpDir, 'frontend.zip');
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    this.createZip(distDir, outputPath);

    console.log('✓ 前端代码打包完成');
  }

  /**
   * 上传前端代码
   */
  async uploadFrontend() {
    console.log('\n>>> 上传前端代码...');

    const deployPath = this.frontendConfig.deployPath;

    // 清理并创建目录
    await this.ssh.sudo(`rm -rf ${deployPath}`);
    await this.ssh.sudo(`mkdir -p ${deployPath}`);
    await this.ssh.sudo(`chown -R ${this.serverConfig.username}:${this.serverConfig.username} ${deployPath}`);

    // 上传压缩包
    const zipPath = path.join(this.tmpDir, 'frontend.zip');
    await this.ssh.upload(zipPath, '/tmp/frontend.zip');

    // 安装 unzip
    await this.ssh.sudo('apt-get install -y unzip 2>/dev/null || yum install -y unzip 2>/dev/null || true');

    // 解压
    await this.ssh.run(`cd ${deployPath} && unzip -o /tmp/frontend.zip`);

    console.log('✓ 前端代码上传完成');
  }

  /**
   * 配置 Nginx
   */
  async configureNginx() {
    console.log('\n>>> 配置 Nginx...');

    const deployPath = this.frontendConfig.deployPath;
    const backendPort = this.backendConfig.port || 3000;

    // 生成 Nginx 配置
    const nginxConfig = this.generateNginxConfig(deployPath, backendPort);

    // 上传配置
    const configPath = path.join(this.tmpDir, 'nginx.conf');
    fs.writeFileSync(configPath, nginxConfig);
    await this.ssh.upload(configPath, '/tmp/vc-nginx');

    // 应用配置
    await this.ssh.sudo('mv /tmp/vc-nginx /etc/nginx/sites-available/vc 2>/dev/null || mv /tmp/vc-nginx /etc/nginx/conf.d/vc.conf');
    await this.ssh.sudo('ln -sf /etc/nginx/sites-available/vc /etc/nginx/sites-enabled/vc 2>/dev/null || true');
    await this.ssh.sudo('rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true');

    // 测试配置
    await this.ssh.sudo('nginx -t');

    // 重载 Nginx
    await this.ssh.sudo('systemctl reload nginx');

    console.log('✓ Nginx 配置完成');
  }

  /**
   * 生成 Nginx 配置
   */
  generateNginxConfig(deployPath, backendPort) {
    return `# 自动生成于 ${new Date().toISOString()}
server {
    listen 80;
    server_name _;

    # 前端静态文件
    root ${deployPath};
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:${backendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io WebSocket 支持
    location /socket.io {
        proxy_pass http://127.0.0.1:${backendPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源缓存
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}`;
  }

  /**
   * 验证部署
   */
  async verify() {
    console.log('\n>>> 验证部署...');

    // 检查 Nginx 状态
    await this.ssh.sudo('systemctl is-active nginx');

    // 检查前端访问
    const result = await this.ssh.run('curl -s -o /dev/null -w "%{http_code}" http://localhost/');
    if (result.stdout.trim() === '200') {
      console.log('✓ 前端访问正常');
    } else {
      console.log('⚠ 前端访问异常, HTTP状态:', result.stdout.trim());
    }

    // 开放防火墙
    await this.ssh.sudo('ufw allow 80/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true');
    await this.ssh.sudo('ufw allow 443/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true');
  }
}

module.exports = FrontendDeployer;
