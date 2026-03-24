# 虚拟班级 — 遗留功能清单

> 按设计文档的 5 个开发阶段整理，标注每项的完成状态。
> 最后更新：2026-03-17

---

## 阶段总览

| 阶段 | 内容 | 状态 |
|------|------|------|
| 第一阶段 (1-2 周) | 基础框架 + 用户认证 | ✅ 已完成 |
| 第二阶段 (3-4 周) | 班级 + 拼班 | ✅ 已完成 |
| 第三阶段 (5-6 周) | 群聊 + 好友 + 私聊 | ✅ 已完成 |
| 第四阶段 (7-8 周) | 选举系统 | ❌ 未开始 |
| 第五阶段 (9-10 周) | 会议 + 打磨 | ❌ 未开始 |

---

## 第一阶段 ✅ 基础框架 + 用户认证

| 功能项 | 状态 | 说明 |
|--------|------|------|
| Express + TS 项目骨架 | ✅ | |
| uni-app + Vue 3 + TS 前端骨架 | ✅ | |
| docker-compose (PG + Redis) | ✅ | |
| 数据库迁移系统 | ✅ | |
| 微信登录 → JWT | ✅ | 开发模式支持 bypass |
| 个人资料 CRUD | ✅ | |
| 登录页 | ✅ | |
| 首页 + TabBar | ✅ | |
| 个人资料页（查看/编辑） | ✅ | |
| 头像上传 | ❌ | 需对接文件存储服务（OSS / COS） |

---

## 第二阶段 ✅ 班级 + 拼班

| 功能项 | 状态 | 说明 |
|--------|------|------|
| 班级 CRUD | ✅ | 创建、列表、详情 |
| 邀请码生成 | ✅ | 8 位随机码 |
| 通过邀请码加入班级 | ✅ | |
| 成员管理（加入/角色） | ✅ | |
| 拼班逻辑（达标自动成班） | ✅ | |
| 拼班定时任务（超时解散/降级） | ✅ | scheduler/classAssembly.ts |
| 每人最多 5 个班级限制 | ✅ | |
| Socket.IO 基础连接 | ✅ | JWT 认证 + 房间管理 |
| 拼班进度实时推送 | ✅ | class:assembled, class:dissolved |
| 班级详情页 — 编辑班级信息 | ❌ | 创建者/班主任可修改名称等 |
| 退出班级 | ❌ | 需前后端接口 |
| 班级名称校验（禁含学校名） | ❌ | 需添加正则/敏感词过滤 |
| 微信分享卡片 | ⚠️ | 前端 onShareAppMessage 已写，需真机测试 |

---

## 第三阶段 ✅ 群聊 + 好友 + 私聊

| 功能项 | 状态 | 说明 |
|--------|------|------|
| **消息模块后端** | | |
| message module (repository/service/router) | ✅ | |
| WebSocket 消息收发 (chat:send → chat:message) | ✅ | |
| 消息持久化到 messages 表 | ✅ | |
| 消息类型支持 (text/image/voice) | ✅ | |
| 历史消息（游标分页） | ✅ | GET /conversations/:id/messages |
| 消息撤回 (chat:recall) | ✅ | 2 分钟内 |
| 未读计数 | ✅ | conversation_participants.unread_count |
| 标记已读 | ✅ | PUT /conversations/:id/read |
| **好友模块后端** | | |
| friendship module (repository/service/router) | ✅ | |
| 好友请求/接受/拒绝 | ✅ | |
| 好友关系类型 (friend/bestie/bro) | ✅ | |
| friendships 数据库表 | ✅ | 迁移 005 |
| 私聊会话创建 | ✅ | 接受好友时自动创建 |
| **前端页面** | | |
| 会话列表页面 | ✅ | pages/conversations |
| 聊天页面 | ✅ | pages/chat |
| 好友列表页面 | ✅ | pages/friends |
| 输入中状态 (chat:typing) | ✅ | Socket 事件 |
| 图片消息发送（上传+预览） | ❌ | 需对接文件存储 |

---

## 第四阶段 ❌ 选举系统

| 功能项 | 状态 | 说明 |
|--------|------|------|
| **后端** | | |
| elections / election_candidates / votes 数据库表 | ❌ | 需添加迁移 |
| election module (repository/service/router) | ❌ | |
| 发起选举（班主任权限） | ❌ | |
| 提名阶段 (24h) | ❌ | |
| 投票阶段 (48h，至少 2 名候选人) | ❌ | |
| 公示阶段 (24h) | ❌ | |
| 就职（自动更新 class_members.role） | ❌ | |
| 每人每选举一票限制 | ❌ | |
| 实时票数 WebSocket 推送 | ❌ | |
| 选举状态机 + 定时切换 | ❌ | |
| **前端** | | |
| 选举列表页 | ❌ | |
| 提名页面（搜索成员 + 提名） | ❌ | |
| 投票页面 (VoteCard 组件) | ❌ | |
| 实时票数展示 | ❌ | |
| 选举结果公示页 | ❌ | |

---

## 第五阶段 ❌ 会议 + 全局打磨

| 功能项 | 状态 | 说明 |
|--------|------|------|
| **会议模块** | | |
| meetings / meeting_topics 数据库表 | ❌ | 需添加迁移 |
| meeting module (repository/service/router) | ❌ | |
| 创建会议（班主任/班委权限） | ❌ | |
| 会议话题管理（排序、状态） | ❌ | |
| 会议专属讨论区（关联 conversation） | ❌ | |
| 会议状态流转 (scheduled → ongoing → ended) | ❌ | |
| **全局打磨** | | |
| API 请求限流 (rate limiting) | ❌ | express-rate-limit + Redis |
| 敏感词过滤 | ❌ | 聊天内容 + 班级名称 |
| 加载态/骨架屏 | ⚠️ | 部分页面已有 loading |
| 微信订阅消息（通知） | ❌ | 拼班成功、选举提醒等 |
| 错误上报 / 日志系统 | ❌ | winston / pino |
| 输入防抖/接口幂等 | ❌ | |
| 前端图片懒加载 | ❌ | |
| 离线消息同步 | ❌ | 上线后拉取未读 |

---

## 跨阶段：基础设施 / 工程化

| 功能项 | 状态 | 优先级 | 说明 |
|--------|------|--------|------|
| .gitignore | ✅ | 高 | 已添加 |
| 静态资源 (TabBar 图标) | ✅ | 高 | 已添加 PNG 占位图 |
| 开发模式登录旁路 | ✅ | 高 | 无 AppID 时自动 bypass |
| 后端单元测试 (vitest/jest) | ❌ | 高 | 至少覆盖 auth, class, 拼班逻辑 |
| 前端类型检查 `tsc --noEmit` | ❌ | 中 | CI 集成 |
| ESLint + Prettier | ❌ | 中 | 代码规范 |
| CI/CD (GitHub Actions) | ❌ | 低 | 自动测试 + 构建 |
| 环境变量区分 (dev/staging/prod) | ❌ | 中 | |
| API 文档 (Swagger / OpenAPI) | ❌ | 低 | |
| 生产数据库备份策略 | ❌ | 中 | pg_dump 定时脚本 |

---

## 当前项目文件结构

```
virtual-class/
├── docker-compose.yml              # PostgreSQL + Redis
├── .gitignore
├── docs/
│   ├── startup-guide.md            # 启动/部署指南
│   └── remaining-features.md       # 本文档
├── server/                         # Node.js 后端
│   ├── src/
│   │   ├── app.ts                  # Express 初始化
│   │   ├── server.ts               # HTTP + Socket.IO 入口
│   │   ├── config/                 # 环境变量
│   │   ├── db/                     # PostgreSQL + Redis + 迁移
│   │   ├── middleware/             # auth, validate, errorHandler
│   │   ├── modules/
│   │   │   ├── auth/               # 微信登录、JWT
│   │   │   ├── class/              # 班级 CRUD、拼班
│   │   │   ├── member/             # 成员管理
│   │   │   ├── message/            # 消息收发
│   │   │   └── friendship/         # 好友关系
│   │   ├── scheduler/              # 定时任务
│   │   ├── socket/                 # Socket.IO
│   │   └── shared/                 # 类型、错误、常量
│   └── migrations/                 # SQL 迁移脚本
└── client/                         # uni-app 前端
    └── src/
        ├── pages/                  # login, home, profile, chat, friends...
        ├── components/             # 可复用组件
        ├── composables/            # useAuth, useSocket
        ├── services/               # API 调用封装
        ├── stores/                 # Pinia (user, class, chat)
        └── types/                  # TypeScript 类型
```

---

## 建议的下一步优先级

1. **进入第四阶段：选举系统** → 班委选举是核心差异化功能
2. **完善第三阶段** → 图片上传、语音消息
3. **添加测试** → 确保核心流程稳定
4. **全局打磨** → 限流、敏感词、订阅消息
