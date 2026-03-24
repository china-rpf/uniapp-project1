const { Client } = require('ssh2');

const SSH = {
  host: '192.168.1.5',
  port: 22,
  username: 'renpengfei',
  password: '123456'
};

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('close', () => resolve(out))
        .on('data', d => out += d)
        .stderr.on('data', d => out += d);
    });
  });
}

async function main() {
  const c = new Client();
  await new Promise((r, e) => c.on('ready', r).on('error', e).connect(SSH));

  const sudo = 'echo ' + SSH.password + ' | sudo -S ';

  console.log('=== Service Status ===\n');

  console.log('1. PostgreSQL:');
  console.log(await run(c, sudo + 'systemctl is-active postgresql'));

  console.log('2. Redis:');
  console.log(await run(c, sudo + 'systemctl is-active redis-server'));

  console.log('3. PM2 (Backend):');
  console.log(await run(c, 'pm2 status'));

  console.log('4. Nginx:');
  console.log(await run(c, sudo + 'systemctl is-active nginx'));

  console.log('5. Backend Health Check:');
  console.log(await run(c, 'curl -s http://localhost:3000/health'));

  console.log('6. Frontend Check:');
  console.log(await run(c, 'curl -s -o /dev/null -w "HTTP Status: %{http_code}\\n" http://localhost/'));

  console.log('\n=== Deployment URLs ===');
  console.log('Frontend: http://192.168.1.5');
  console.log('Backend API: http://192.168.1.5:3000');
  console.log('API via Nginx: http://192.168.1.5/api');

  c.end();
}

main();
