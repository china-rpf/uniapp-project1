/**
 * SSH 连接管理器
 */
const { Client } = require('ssh2');

class SSHManager {
  constructor(config) {
    this.config = config;
    this.client = null;
  }

  /**
   * 连接服务器
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.client = new Client();
      this.client
        .on('ready', () => {
          console.log(`✓ 已连接到 ${this.config.host}`);
          resolve();
        })
        .on('error', reject)
        .connect(this.config);
    });
  }

  /**
   * 执行命令
   */
  async run(cmd, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`命令超时: ${cmd.slice(0, 50)}...`)), timeout);

      this.client.exec(cmd, (err, stream) => {
        if (err) { clearTimeout(timer); return reject(err); }

        let stdout = '', stderr = '';
        stream
          .on('close', () => {
            clearTimeout(timer);
            resolve({ stdout, stderr, code: 0 });
          })
          .on('data', data => {
            stdout += data;
            process.stdout.write(data);
          })
          .stderr.on('data', data => {
            stderr += data;
            process.stderr.write(data);
          });
      });
    });
  }

  /**
   * 执行 sudo 命令
   */
  async sudo(cmd, timeout = 60000) {
    const sudoCmd = `echo '${this.config.password}' | sudo -S ${cmd}`;
    return this.run(sudoCmd, timeout);
  }

  /**
   * 上传文件
   */
  async upload(localPath, remotePath) {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) return reject(err);

        sftp.fastPut(localPath, remotePath, err => {
          if (err) return reject(err);
          console.log(`✓ 上传: ${remotePath}`);
          resolve();
        });
      });
    });
  }

  /**
   * 下载文件
   */
  async download(remotePath, localPath) {
    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) return reject(err);

        sftp.fastGet(remotePath, localPath, err => {
          if (err) return reject(err);
          console.log(`✓ 下载: ${localPath}`);
          resolve();
        });
      });
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

module.exports = SSHManager;
