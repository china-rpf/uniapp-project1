# 部署工具

自动化部署前后端服务到远程服务器。

## 快速开始

### 1. 配置服务器信息

复制配置模板并修改：

```bash
cp config.example.json config.json
```

编辑 `config.json`，填入你的服务器信息：

```json
{
  "servers": {
    "production": {
      "host": "192.168.1.100",
      "port": 22,
      "username": "deploy",
      "password": "your-password",
      "os": "ubuntu"
    }
  }
}
```

### 2. 部署命令

```bash
# 部署前后端
npm run deploy

# 只部署后端
npm run deploy:backend

# 只部署前端
npm run deploy:frontend

# 查看服务状态
npm run status

# 查看日志
npm run logs

# 重启服务
npm run restart

# 停止服务
npm run stop

# 初始化服务器环境
npm run setup
```

### 3. CLI 命令

```bash
# 查看帮助
node cli.js --help

# 部署到指定环境
node cli.js deploy:all -e staging

# 使用指定配置文件
node cli.js deploy:all -c /path/to/config.json
```

## 目录结构

```
deploy/
├── cli.js              # 命令行入口
├── config.json         # 配置文件 (需自行创建)
├── config.example.json # 配置模板
├── package.json
├── lib/
│   ├── ssh.js              # SSH 连接管理
│   ├── deployer.js         # 部署器基类
│   ├── backend-deployer.js # 后端部署器
│   └── frontend-deployer.js# 前端部署器
└── tmp/                    # 临时文件目录
```

## 功能说明

### 后端部署 (deploy:backend)

1. 检查/安装系统依赖 (PostgreSQL, Redis, Node.js)
2. 上传编译后的代码 (dist/, migrations/)
3. 安装 npm 依赖包
4. 运行数据库迁移
5. 使用 PM2 启动/更新服务
6. 配置开机自启

### 前端部署 (deploy:frontend)

1. 检查/安装 Nginx
2. 打包前端构建产物
3. 上传到服务器
4. 配置 Nginx (反向代理 + 静态文件)
5. 验证部署

### 初始化服务器 (setup)

安装所有必要的软件：
- Node.js 18
- PM2
- PostgreSQL
- Redis
- Nginx

## 配置说明

### servers

| 字段 | 说明 |
|------|------|
| host | 服务器 IP |
| port | SSH 端口 |
| username | SSH 用户名 |
| password | SSH 密码 |
| os | 操作系统 (ubuntu/centos) |

### backend

| 字段 | 说明 |
|------|------|
| sourceDir | 后端源码目录 (相对于 deploy/) |
| deployPath | 服务器部署路径 |
| startCommand | 启动命令 |
| appName | PM2 应用名 |
| port | 服务端口 |

### frontend

| 字段 | 说明 |
|------|------|
| sourceDir | 前端源码目录 |
| deployPath | 服务器部署路径 |

### database

| 字段 | 说明 |
|------|------|
| host | 数据库地址 |
| port | 端口 |
| name | 数据库名 |
| user | 用户名 |
| password | 密码 |

## 部署后访问

- 前端: `http://<server-ip>`
- 后端 API: `http://<server-ip>:3000`
- API (通过 Nginx): `http://<server-ip>/api`

## 常见问题

### 1. SSH 连接失败

- 检查服务器 IP 和端口
- 确认用户名密码正确
- 确认服务器 SSH 服务已启动

### 2. npm install 失败

- 检查服务器网络
- 尝试手动连接服务器执行 `npm cache clean --force`

### 3. 数据库迁移失败

- 检查数据库连接配置
- 确认 PostgreSQL 服务已启动

### 4. 前端页面无法访问

- 检查 Nginx 配置: `sudo nginx -t`
- 查看 Nginx 日志: `sudo tail -f /var/log/nginx/error.log`
