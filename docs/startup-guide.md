# 虚拟班级 — 启动、验证与部署指南

## 一、环境要求

| 工具 | 版本要求 | 用途 |
|------|---------|------|
| Node.js | >= 18.x | 前后端运行环境 |
| npm | >= 9.x | 包管理 |
| Docker & Docker Compose | >= 20.x | PostgreSQL + Redis |
| 微信开发者工具 | 最新版 | 小程序预览调试 |
| Git | >= 2.x | 版本控制 |

---

## 二、本地启动步骤

### 1. 启动数据库（PostgreSQL + Redis）

```bash
# 项目根目录
cd f:/uniapp-project
docker-compose up -d
```

验证数据库运行：
```bash
docker ps
# 应看到 vc-postgres (5432) 和 vc-redis (6379) 两个容器
```

> 如需清除数���重来：`docker-compose down -v && docker-compose up -d`

### 2. 启动后端

```bash
cd server

# 安装依赖（首次或 package.json 变更后执行）
npm install

# 执��数据库迁移
npm run migrate
# 应看到: Executed 001_create_users.sql / 002 / 003 / 004 ...

# 启动开发服务器（热重载）
npm run dev
# 应看到: Server running on http://localhost:3000
#         Socket.IO initialized
```

### 3. 启动前端

```bash
cd client

# 安装依赖
npm install

# 方式一：微信小程序（需微信开发者工具）
npm run dev:mp-weixin
# 编译产物在 dist/dev/mp-weixin，用微信开发者工具打开该目录

# 方式二：H5 网页调试（浏览器直接预览，无需微信开发者工具）
npm run dev:h5
# 浏览器打开 http://localhost:8080
```

### 4. 完整启动一览

| 终端 | 命令 | 地址 |
|------|------|------|
| 终端 1 | `docker-compose up -d` | PostgreSQL :5432, Redis :6379 |
| 终端 2 | `cd server && npm run dev` | http://localhost:3000 |
| 终端 3 | `cd client && npm run dev:h5` | http://localhost:8080 |

---

## 三、接口验证

后端启动后，可用 curl / Postman / Apifox 测试：

### 健康检查

```bash
curl http://localhost:3000/health
# 期望: {"status":"ok","timestamp":"..."}
```

### 微信登录（开发环境模拟）

> 真实环境需要微信小程序的 `code`。开发阶段可临时在 `auth/service.ts` 中
> 跳过微信 API 调用，直接用固定 openid 测试。

临时开发模式改法（仅限本地调试）：

在 `server/src/modules/auth/service.ts` 的 `wxLogin` 函数中，
在正式微信 API 调用前添加：

```typescript
// ===== 开发模式：跳过微信验证 =====
if (config.nodeEnv === 'development') {
  const openid = `dev_${code}`; // 用 code �� openid
  let user = await authRepo.findByOpenid(openid);
  let isNew = false;
  if (!user) {
    user = await authRepo.createUser(openid);
    isNew = true;
  }
  const payload: JwtPayload = { userId: user.id, openid: user.wx_openid };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  return { token, user, isNew };
}
// ===== 开发模式结束 =====
```

测试流程：

```bash
# 1. 登录（获取 token）
curl -X POST http://localhost:3000/auth/wx-login \
  -H "Content-Type: application/json" \
  -d '{"code":"testuser1"}'
# 返回: {"code":200,"data":{"token":"eyJ...","user":{...},"isNew":true}}

# 2. 复制返回的 token，后续请求带上
TOKEN="eyJ..."

# 3. 查看个人信息
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. 更新个人资料
curl -X PUT http://localhost:3000/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"张同学","gender":1,"grade":"高一","bio":"大家好"}'

# 5. 创建班级
curl -X POST http://localhost:3000/classes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"快乐学习班","min_members":10,"max_members":40}'
# 返回含 invite_code

# 6. 查看我的班级
curl http://localhost:3000/classes/my \
  -H "Authorization: Bearer $TOKEN"

# 7. 通过邀请码加入班级（用另一个用户的 token）
curl -X POST http://localhost:3000/classes/join \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{"invite_code":"XXXXXXXX"}'
```

---

## 四、数据库管理

### 连接数据库

```bash
# 通过 Docker 进入 psql
docker exec -it vc-postgres psql -U vcuser -d virtual_class

# 常用查询
SELECT * FROM users;
SELECT * FROM classes;
SELECT * FROM class_members;
SELECT * FROM _migrations;  -- 已执行的迁移
```

### 重新迁移

```bash
# 删除所有数据重新迁移
docker exec -it vc-postgres psql -U vcuser -d virtual_class -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd server && npm run migrate
```

### Redis 查看

```bash
docker exec -it vc-redis redis-cli
> KEYS *
> GET online:<userId>
```

---

## 五、微信小程序预览

1. 在 `client/src/manifest.json` 的 `mp-weixin.appid` 填入真实小程序 AppID
2. 在 `server/.env` 的 `WX_APPID` 和 `WX_SECRET` 填入真实值
3. 运行 `cd client && npm run dev:mp-weixin`
4. 打开微信开发者工具 → 导入项目 → 选��� `client/dist/dev/mp-weixin` 目录
5. 在开发者工具的「详情」→「本地设置」中勾选「不校验合法域名」
6. 预览/真机调试

---

## 六、生产部署方案

### 后端部署（推荐方式）

#### 方案 A：云服务器 (CentOS/Ubuntu)

```bash
# 1. 服务器安装 Node.js 18+, Docker
# 2. 上传代码或 git clone
# 3. 启动数据库
docker-compose -f docker-compose.yml up -d

# 4. 构建后端
cd server
npm install --production
npm run build

# 5. 配置生产环境变量
cp .env.example .env
# 编辑 .env：修改 JWT_SECRET、WX_APPID、WX_SECRET、数据库密码等

# 6. 执行迁移
npm run migrate

# 7. 用 PM2 启动
npm install -g pm2
pm2 start dist/server.js --name vc-server
pm2 save
pm2 startup
```

#### 方案 B：Docker 全容器化

```dockerfile
# server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```bash
cd server
npm run build
docker build -t vc-server .
docker run -d -p 3000:3000 --env-file .env --name vc-server vc-server
```

### Nginx 反向代理

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

> WebSocket (Socket.IO) 需要 `Upgrade` 和 `Connection` 头，上面的配置已包含。

### 小程序发布

1. ���信后台配置服务器域名：`request 合法域名` + `socket 合法域名` → `https://api.yourdomain.com`
2. 前端修改 `client/src/services/http.ts` 中 `BASE_URL` 为生产域名
3. 前端修改 `client/src/composables/useSocket.ts` 中 `BASE_WS_URL` 为 `wss://api.yourdomain.com`
4. 运行 `cd client && npm run build:mp-weixin`
5. 微信开发者工具上传代码 → 微信后台提交审核

---

## 七、常见问题

| 问题 | 解决方案 |
|------|---------|
| `PostgreSQL connection failed` | 确认 Docker 容器在运行：`docker ps` |
| `Redis connection failed` | 非致命错误，应用仍可运行，检查 Redis 容器 |
| 前端请求 401 | Token 过期或未登录，检查 localStorage 中 token |
| 微信登录失败 | 开发环境用上面的模拟方案；生产环境检查 AppID/Secret |
| 端口被占用 | 修改 `.env` 中的 `PORT` 或用 `lsof -i :3000` 查找占用进程 |
| 迁移失败 | 检查 SQL 语法，或清空数据库重新迁移 |
