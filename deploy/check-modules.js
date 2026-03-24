const { Client } = require('ssh2');
const config = {
  host: '192.168.1.5',
  port: 22,
  username: 'renpengfei',
  password: '123456'
};

const c = new Client();
c.on('ready', () => {
  c.exec('ls -la /opt/vc/dist/modules/ && ls -la /opt/vc/dist/modules/auth/', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d).on('close', () => {
      console.log(out);
      c.end();
    });
  });
}).connect(config);
