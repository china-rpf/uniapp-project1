const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// Ubuntu 24 服务器配置
const SSH = {
  host: '192.168.1.5',
  port: 22,
  username: 'renpengfei',
  password: '123456'
};

function run(conn, cmd, ms) {
  if (!ms) ms = 60000;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Timeout: ' + cmd)), ms);
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

function listFiles(dir) {
  const arr = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    fs.statSync(p).isDirectory() ? arr.push(...listFiles(p)) : arr.push(p);
  }
  return arr;
}

async function main() {
  const c = new Client();
  console.log('Connecting to Ubuntu 24 server...');
  await new Promise((r, e) => c.on('ready', r).on('error', e).connect(SSH));
  console.log('Connected!');

  try {
    console.log('\n=== 1. Updating system and installing PostgreSQL + Redis ===');
    await run(c, 'echo ' + SSH.password + ' | sudo -S apt-get update', 120000);
    await run(c, 'echo ' + SSH.password + ' | sudo -S DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib redis-server', 180000);

    console.log('\n=== 2. Starting PostgreSQL and Redis ===');
    await run(c, 'echo ' + SSH.password + ' | sudo -S systemctl start postgresql redis-server', 30000);
    await run(c, 'echo ' + SSH.password + ' | sudo -S systemctl enable postgresql redis-server', 10000);

    console.log('\n=== 3. Setting up database ===');
    // 创建用户和数据库
    await run(c, 'echo ' + SSH.password + ' | sudo -S -u postgres psql -c "CREATE USER vcuser WITH PASSWORD \'vcpass123\';"', 10000);
    await run(c, 'echo ' + SSH.password + ' | sudo -S -u postgres psql -c "CREATE DATABASE virtual_class OWNER vcuser;"', 10000);
    await run(c, 'echo ' + SSH.password + ' | sudo -S -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE virtual_class TO vcuser;"', 10000);

    console.log('\n=== 4. Installing Node.js 18 + npm ===');
    await run(c, 'echo ' + SSH.password + ' | sudo -S apt-get install -y curl', 60000);
    await run(c, 'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -', 60000);
    await run(c, 'echo ' + SSH.password + ' | sudo -S apt-get install -y nodejs', 120000);
    // 确保 npm 已安装
    await run(c, 'echo ' + SSH.password + ' | sudo -S apt-get install -y npm', 60000);
    await run(c, 'node --version && npm --version', 10000);

    console.log('\n=== 5. Uploading backend code ===');
    await run(c, 'echo ' + SSH.password + ' | sudo -S rm -rf /opt/vc', 30000);
    await run(c, 'echo ' + SSH.password + ' | sudo -S mkdir -p /opt/vc/dist /opt/vc/migrations', 30000);
    await run(c, 'echo ' + SSH.password + ' | sudo -S chown -R $USER:$USER /opt/vc', 10000);

    await upload(c, 'f:/uniapp-project/server/package.json', '/opt/vc/package.json');
    await upload(c, 'f:/uniapp-project/server/package-lock.json', '/opt/vc/package-lock.json');

    // 上传 dist 目录
    const distFiles = listFiles('f:/uniapp-project/server/dist');
    for (const f of distFiles) {
      const rel = f.replace('f:\\uniapp-project\\server\\dist\\', '').replace(/\\/g, '/');
      const dst = '/opt/vc/dist/' + rel;
      const dir = path.dirname(dst);
      await run(c, 'mkdir -p "' + dir + '"');
      await upload(c, f, dst);
    }

    // 上传 migrations 目录
    const migFiles = fs.readdirSync('f:/uniapp-project/server/migrations');
    for (const f of migFiles) {
      await upload(c, 'f:/uniapp-project/server/migrations/' + f, '/opt/vc/migrations/' + f);
    }

    console.log('\n=== 6. Installing dependencies ===');
    await run(c, 'cd /opt/vc && npm install --production --registry=https://registry.npmmirror.com', 120000);

    console.log('\n=== 7. Running migrations ===');
    await run(c, 'cd /opt/vc && node -e "const pg=require(\'pg\');const fs=require(\'fs\');(async()=>{const p=new pg.Pool({host:\'127.0.0.1\',database:\'virtual_class\',user:\'vcuser\',password:\'vcpass123\'});const c=await p.connect();await c.query(\'CREATE TABLE IF NOT EXISTS _migrations(id SERIAL PRIMARY KEY,name VARCHAR(255) UNIQUE,executed_at TIMESTAMPTZ DEFAULT NOW())\');for(const f of fs.readdirSync(\'./migrations\').filter(f=>f.endsWith(\'.sql\')).sort()){const{rows}=await c.query(\'SELECT id FROM _migrations WHERE name=$1\',[f]);if(rows.length===0){const sql=fs.readFileSync(\'./migrations/\'+f,\'utf8\');try{await c.query(sql);await c.query(\'INSERT INTO _migrations(name) VALUES($1)\',[f]);console.log(\'OK:\',f)}catch(e){console.log(\'FAIL:\',f,e.message)}}}c.release();process.exit(0)})()"', 60000);

    console.log('\n=== 8. Installing PM2 and starting server ===');
    await run(c, 'echo ' + SSH.password + ' | sudo -S npm install -g pm2 --registry=https://registry.npmmirror.com', 60000);
    await run(c, 'cd /opt/vc && pm2 delete vc 2>/dev/null; pm2 start dist/server.js --name vc && pm2 save', 30000);

    console.log('\n=== 9. Setting up PM2 startup ===');
    const startupOut = await run(c, 'pm2 startup', 10000);
    if (startupOut.includes('sudo')) {
      const cmd = startupOut.match(/sudo.+/g);
      if (cmd && cmd[0]) {
        await run(c, 'echo ' + SSH.password + ' | ' + cmd[0], 30000);
      }
    }

    console.log('\n=== 10. Verifying backend ===');
    await run(c, 'sleep 2 && curl -s http://localhost:3000/health || echo "Health check failed"', 15000);

    console.log('\n=== 11. Uploading frontend code ===');
    await run(c, 'mkdir -p /opt/vc/client');
    await run(c, 'echo ' + SSH.password + ' | sudo -S chown -R $USER:$USER /opt/vc/client', 10000);

    // 上传前端构建产物
    if (fs.existsSync('f:/uniapp-project/client/dist')) {
      const clientDistFiles = listFiles('f:/uniapp-project/client/dist');
      for (const f of clientDistFiles) {
        const rel = f.replace('f:\\uniapp-project\\client\\dist\\', '').replace(/\\/g, '/');
        const dst = '/opt/vc/client/' + rel;
        const dir = path.dirname(dst);
        await run(c, 'mkdir -p "' + dir + '"');
        await upload(c, f, dst);
      }
    }

    console.log('\n=== 12. Opening firewall port 3000 ===');
    await run(c, 'echo ' + SSH.password + ' | sudo -S ufw allow 3000/tcp 2>/dev/null || true', 10000);

    console.log('\n' + '='.repeat(50));
    console.log('DEPLOYMENT COMPLETE!');
    console.log('Backend API: http://192.168.1.5:3000');
    console.log('='.repeat(50));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    c.end();
  }
}

main();
