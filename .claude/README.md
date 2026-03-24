# 部署指南

本项目使用 Claude Code Skills 封装了完整的部署能力，**直接用自然语言描述需求即可自动部署**。

## 快速开始

### 1. 配置服务器信息

编辑 `deploy/config.json`：

```json
{
  "servers": {
    "production": {
      "host": "192.168.1.5",
      "port": 22,
      "username": "renpengfei",
      "password": "123456",
      "os": "ubuntu"
    }
  }
}
```

### 2. 部署方式

**方式一：自然语言（推荐）**

直接告诉 Claude 你的需求，它会自动识别并执行：

```
用户: 前端改好了，推送到服务器
Claude: 好的，正在部署前端...
        ✓ 前端部署完成

用户: 后端代码更新了
Claude: 好的，正在部署后端...
        ✓ 后端部署完成

用户: 帮我查看服务器状态
Claude: === 服务状态 ===
        PostgreSQL: active
        Redis: active
        ...
```

**方式二：使用命令**

| 命令 | 说明 |
|------|------|
| `/push` | **智能部署** (自动检测变更，推荐) |
| `/push-backend` | 强制推送后端 |
| `/push-frontend` | 强制推送前端 |
| `/deploy` | 完整部署前后端 |
| `/deploy-backend` | 只部署后端 |
| `/deploy-frontend` | 只部署前端 |
| `/status` | 查看服务状态 |
| `/logs` | 查看后端日志 |
| `/restart` | 重启后端服务 |
| `/stop` | 停止后端服务 |
| `/setup-server` | 初始化新服务器 |

## 常用语句

你可以这样说，Claude 会自动执行相应操作：

| 你说的话 | Claude 执行的操作 |
|----------|------------------|
| "前端改好了" | `/push` - 智能部署 |
| "后端更新了" | `/push` - 智能部署 |
| "推送到服务器" | `/push` - 智能部署 |
| "帮我部署一下" | `/push` - 智能部署 |
| "查看服务器状态" | `/status` - 查看状态 |
| "看看日志" | `/logs` - 查看日志 |
| "重启服务" | `/restart` - 重启后端 |

## 使用示例

### 日常更新 (推荐)

```
用户: 我修改了后端代码，帮我更新到服务器
Claude: 运行 /push
        检测到后端代码变更
        正在部署后端...
        ✓ 后端部署完成
```

```
用户: 前端改好了，推送到服务器
Claude: 运行 /push
        检测到前端代码变更
        正在部署前端...
        ✓ 前端部署完成
```

### 首次部署

```
用户: /deploy
Claude: 正在部署前后端服务...
        ✓ 后端部署完成
        ✓ 前端部署完成
        访问地址: http://192.168.1.5
```

### 查看状态

```
用户: /status
Claude: === 服务状态 ===
        PostgreSQL: active
        Redis: active
        Backend: online
        Nginx: active
```

### 查看日志

```
用户: /logs
Claude: 显示后端最近 50 行日志...
```

### 重启服务

```
用户: /restart
Claude: 正在重启后端服务...
        ✓ 服务已重启
```

## 新服务器初始化

当有一台全新的服务器时：

```
1. 编辑 deploy/config.json 添加服务器信息
2. 运行 /setup-server 安装所有依赖
3. 运行 /deploy 部署应用
```

`/setup-server` 会自动安装：
- Node.js 18 + npm
- PM2 进程管理
- PostgreSQL 数据库
- Redis 缓存
- Nginx Web 服务器

## 部署流程详解

### 后端部署 (`/deploy-backend`)

1. 检查/安装系统依赖 (PostgreSQL, Redis, Node.js)
2. 上传编译后的代码 (`server/dist/`, `server/migrations/`)
3. 安装 npm 依赖包
4. 运行数据库迁移
5. 使用 PM2 启动/更新服务
6. 配置开机自启

### 前端部署 (`/deploy-frontend`)

1. 检查/安装 Nginx
2. 打包前端构建产物 (`client/dist/`)
3. 上传到服务器
4. 配置 Nginx (反向代理 + 静态文件)
5. 验证部署

## 访问地址

部署完成后可通过以下地址访问：

| 服务 | 地址 |
|------|------|
| 前端 | http://192.168.1.5 |
| 后端 API | http://192.168.1.5:3000 |
| API (Nginx代理) | http://192.168.1.5/api |

## 多环境支持

可以在 `config.json` 中配置多个环境：

```json
{
  "servers": {
    "production": {
      "host": "192.168.1.5",
      "os": "ubuntu"
    },
    "staging": {
      "host": "192.168.1.100",
      "os": "ubuntu"
    }
  }
}
```

切换环境时修改 `config.json` 中的默认环境，或直接编辑 CLI 命令。

## 目录结构

```
deploy/
├── cli.js              # 命令行入口
├── config.json         # 配置文件
├── config.example.json # 配置模板
├── package.json        # npm 脚本
├── README.md           # 详细文档
└── lib/
    ├── ssh.js              # SSH 连接管理
    ├── deployer.js         # 部署器基类
    ├── backend-deployer.js # 后端部署
    └── frontend-deployer.js# 前端部署

.claude/skills/
├── deploy.md           # /deploy
├── deploy-backend.md   # /deploy-backend
├── deploy-frontend.md  # /deploy-frontend
├── status.md           # /status
├── logs.md             # /logs
├── restart.md          # /restart
├── stop.md             # /stop
└── setup-server.md     # /setup-server
```

## 手动部署

如果需要手动部署，可以使用 npm 脚本：

```bash
cd deploy

npm run deploy           # 部署前后端
npm run deploy:backend   # 只部署后端
npm run deploy:frontend  # 只部署前端
npm run status           # 查看状态
npm run logs             # 查看日志
npm run restart          # 重启服务
```

## 常见问题

### SSH 连接失败

- 检查服务器 IP 和端口是否正确
- 确认用户名密码正确
- 确认服务器 SSH 服务已启动

### 部署失败

1. 运行 `/status` 检查各服务状态
2. 运行 `/logs` 查看错误日志
3. SSH 到服务器手动排查

### 数据库连接失败

- 确认 PostgreSQL 服务已启动
- 检查 `config.json` 中的数据库配置
- 确认数据库用户和权限

### 前端页面无法访问

- 检查 Nginx 状态: `systemctl status nginx`
- 查看 Nginx 日志: `tail -f /var/log/nginx/error.log`
- 检查防火墙: `ufw status`
