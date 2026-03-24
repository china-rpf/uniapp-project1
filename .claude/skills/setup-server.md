# Setup Server

初始化新服务器环境，安装所有必要的软件。

## 执行步骤

```bash
cd f:/uniapp-project/deploy && node cli.js setup
```

## 安装的软件

- Node.js 18
- npm
- PM2 (进程管理)
- PostgreSQL (数据库)
- Redis (缓存)
- Nginx (Web 服务器)

## 使用场景

当你有一台全新的服务器时，运行此命令自动安装所有依赖。

**注意**: 如果服务器已安装过这些软件，此命令会跳过已安装的部分。

## 配置新服务器

1. 编辑 `deploy/config.json`，添加新服务器信息
2. 运行 `/setup-server`
3. 运行 `/deploy` 部署应用

## 相关命令

- `/deploy` - 部署应用
- `/status` - 查看服务状态
