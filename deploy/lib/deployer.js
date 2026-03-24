/**
 * 部署器基类
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const SSHManager = require('./ssh');

class BaseDeployer {
  constructor(config, serverConfig) {
    this.config = config;
    this.serverConfig = serverConfig;
    this.ssh = new SSHManager(serverConfig);
    this.tmpDir = path.join(__dirname, '../tmp');
  }

  /**
   * 确保临时目录存在
   */
  ensureTmpDir() {
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
  }

  /**
   * 清理临时目录
   */
  cleanTmpDir() {
    if (fs.existsSync(this.tmpDir)) {
      fs.rmSync(this.tmpDir, { recursive: true, force: true });
    }
  }

  /**
   * 创建 zip 压缩包 (Windows 兼容)
   */
  createZip(sourcePath, outputPath) {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    execSync(`powershell -Command "Compress-Archive -Path '${sourcePath}/*' -DestinationPath '${outputPath}'"`, {
      stdio: 'inherit'
    });
    console.log(`✓ 创建压缩包: ${outputPath}`);
  }

  /**
   * 创建 tar.gz 压缩包 (Linux/Mac)
   */
  createTarGz(sourcePath, outputPath) {
    execSync(`tar -czf "${outputPath}" -C "${sourcePath}" .`, { stdio: 'inherit' });
    console.log(`✓ 创建压缩包: ${outputPath}`);
  }

  /**
   * 连接服务器
   */
  async connect() {
    await this.ssh.connect();
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.ssh.disconnect();
  }

  /**
   * 子类实现具体部署逻辑
   */
  async deploy() {
    throw new Error('子类必须实现 deploy() 方法');
  }
}

module.exports = BaseDeployer;
