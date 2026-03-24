const { Client } = require('ssh2');
const fs = require('fs');
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
    // 步骤1: 安装 Nginx
    console.log('\n=== Step 1: Installing Nginx ===');
    await run(c, sudo + 'apt-get install -y nginx', 120000);

    // 步骤2: 创建前端部署包
    console.log('\n=== Step 2: Creating frontend package ===');
    const tmpDir = 'f:/uniapp-project/deploy/tmp';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // 使用 PowerShell 压缩
    console.log('Creating zip...');
    const clientDist = 'f:/uniapp-project/client/dist';
    const zipPath = tmpDir + '/client.zip';
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    execSync('powershell -Command "Compress-Archive -Path \'' + clientDist + '/*\' -DestinationPath \'' + zipPath + '\'"', { stdio: 'inherit' });

    // 步骤3: 上传前端文件
    console.log('\n=== Step 3: Uploading frontend files ===');
    await run(c, sudo + 'rm -rf /var/www/vc-client', 10000);
    await run(c, sudo + 'mkdir -p /var/www/vc-client', 10000);
    await run(c, sudo + 'chown -R renpengfei:renpengfei /var/www/vc-client', 10000);
    await upload(c, tmpDir + '/client.zip', '/tmp/client.zip');
    // 安装 unzip 并解压
    await run(c, sudo + 'apt-get install -y unzip', 60000);
    await run(c, 'cd /var/www/vc-client && unzip -o /tmp/client.zip', 30000);

    // 步骤4: 配置 Nginx
    console.log('\n=== Step 4: Configuring Nginx ===');
    const nginxConfig = `server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /var/www/vc-client;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io WebSocket 支持
    location /socket.io {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`;

    fs.writeFileSync(tmpDir + '/vc-nginx', nginxConfig);
    await upload(c, tmpDir + '/vc-nginx', '/tmp/vc-nginx');
    await run(c, sudo + 'mv /tmp/vc-nginx /etc/nginx/sites-available/vc', 10000);
    await run(c, sudo + 'ln -sf /etc/nginx/sites-available/vc /etc/nginx/sites-enabled/vc', 10000);
    await run(c, sudo + 'rm -f /etc/nginx/sites-enabled/default', 10000);
    await run(c, sudo + 'nginx -t', 10000);
    await run(c, sudo + 'systemctl reload nginx', 10000);
    await run(c, sudo + 'systemctl enable nginx', 10000);

    // 步骤5: 打开防火墙端口
    console.log('\n=== Step 5: Opening firewall ===');
    await run(c, sudo + 'ufw allow 80/tcp 2>/dev/null || true', 10000);
    await run(c, sudo + 'ufw allow 443/tcp 2>/dev/null || true', 10000);

    // 步骤6: 验证
    console.log('\n=== Step 6: Verifying ===');
    await run(c, 'curl -s -o /dev/null -w "%{http_code}" http://localhost/', 10000);

    console.log('\n' + '='.repeat(50));
    console.log('FRONTEND DEPLOYMENT COMPLETE!');
    console.log('Frontend: http://192.168.1.5');
    console.log('Backend API: http://192.168.1.5/api');
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
