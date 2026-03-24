# 虚拟班级微信小程序 MVP 技术方案

## Context

解决教育资源分化导致的社交圈层固化问题。打造去标签化（不暴露学校、地区）的虚拟班级社交平台，让不同学校的学生能在平等环境中交流学习。

技术选型：uni-app (Vue 3 + TS) + Node.js (Express + TS) + PostgreSQL + Redis + Socket.IO

---

## 1. 项目结构

```
virtual-class/
├── docker-compose.yml              # PostgreSQL + Redis 本地开发
├── server/                         # Node.js 后端
│   ├── src/
│   │   ├── app.ts                  # Express 初始化
│   │   ├── server.ts               # 入口：HTTP + WebSocket
│   │   ├── config/                 # 环境变量、DB 配置
│   │   ├── middleware/             # auth, validate(zod), errorHandler
│   │   ├── modules/
│   │   │   ├── auth/               # 微信登录、JWT
│   │   │   ├── class/              # 班级 CRUD、拼班逻辑
│   │   │   ├── member/             # 成员管理、自我介绍
│   │   │   ├── election/           # 选举全流程
│   │   │   ├── message/            # 消息收发 + WebSocket gateway
│   │   │   ├── friendship/         # 好友关系（闺蜜/兄弟）
│   │   │   └── meeting/            # 班级会议 + 话题
│   │   ├── socket/                 # Socket.IO 初始化、房间管理
│   │   ├── shared/                 # 类型、错误码、常量
│   │   └── db/                     # pg Pool + Redis 客户端
│   ├── migrations/                 # 数据库迁移
│   └── tests/
└── client/                         # uni-app 前端
    └── src/
        ├── pages/                  # login, home, class, chat, election, meeting, friend, profile
        ├── components/             # ClassCard, MessageBubble, VoteCard 等
        ├── composables/            # useAuth, useSocket, useClass, useChat
        ├── services/               # API 调用封装
        ├── stores/                 # Pinia (user, class, chat)
        └── types/                  # TypeScript 类型定义
```

每个后端模块统一四层：`router.ts` → `service.ts` → `repository.ts` + `schema.ts`(zod)

---

## 2. 数据库设计（12 张核心表）

### 用户与班级
- **users** — 用户（wx_openid, nickname, avatar, gender, birth_year, grade, bio, status）
- **classes** — 班级（name, creator_id, invite_code, min/max/current_members, grade_tag, status, assemble_deadline）
- **class_members** — 班级成员（class_id, user_id, role, introduction, display_name, join_method, status）

### 选举
- **elections** — 选举（class_id, position, status, nominate/vote/announce 时间区间, winner_id）
- **election_candidates** — 候选人（election_id, user_id, nominator_id, speech, vote_count）
- **votes** — 投票（election_id, voter_id, candidate_id，每人每选举一票）

### 消息
- **conversations** — 会话（type: 班级群聊/私聊/会议, class_id, last_message_at）
- **conversation_participants** — 会话参与者（unread_count, muted）
- **messages** — 消息（conversation_id, sender_id, type: text/image/voice/system, content, reply_to_id）

### 好友与会议
- **friendships** — 好友关系（requester/addressee, type: friend/bestie/bro, conversation_id）
- **meetings** — 班级会议（class_id, title, conversation_id, status: scheduled/ongoing/ended）
- **meeting_topics** — 会议话题（meeting_id, title, content, sort_order, status）

所有表：UUID 主键、created_at/updated_at 时间戳。

---

## 3. API 设计

### REST API

| 模块 | 核心端点 |
|------|---------|
| 认证 | `POST /auth/wx-login`, `PUT /auth/profile`, `GET /auth/me` |
| 班级 | `POST /classes`, `GET /classes`, `GET /classes/:id`, `POST /classes/:id/join`, `GET /my/classes` |
| 选举 | `POST /classes/:cid/elections`, `POST /elections/:id/nominate`, `POST /elections/:id/vote` |
| 消息 | `GET /conversations`, `GET /conversations/:id/messages`(游标分页), `PUT /conversations/:id/read` |
| 好友 | `POST /friendships/request`, `PUT /friendships/:id/accept`, `GET /friendships` |
| 会议 | `POST /classes/:cid/meetings`, `PUT /meetings/:id/start`, `POST /meetings/:id/topics` |

### WebSocket 事件

| 方向 | 事件 | 说明 |
|------|------|------|
| C→S | `chat:send`, `chat:typing`, `chat:recall` | 消息发送/输入/撤回 |
| S→C | `chat:message`, `chat:typing`, `chat:recalled` | 消息推送 |
| S→C | `class:member_joined`, `class:assembled` | 拼班进度/成班通知 |
| S→C | `election:updated`, `election:vote_update` | 选举状态/实时票数 |
| S→C | `meeting:status`, `notification` | 会议状态/通用通知 |

---

## 4. 核心业务流程

### 拼班流程
创建班级(assembling) → 分享邀请码 → 成员加入(实时更新进度) → 达到最低人数 → 自动成班(active) → 创建群聊 → 通知所有成员

- 默认 7 天拼班期，最低 15 人（可配 10-30），最大 50 人（可配 20-60）
- 超时未达 10 人自动解散，达 10 人以上降级成班

### 选举流程
发起(班主任权限) → 提名阶段(24h) → 投票阶段(48h，至少 2 名候选人) → 公示(24h) → 就职(更新 role)

### 消息流程
WebSocket 收发 → 持久化到 messages 表 → 广播到 room → Redis 维护未读计数 → 离线用户上线拉取历史

---

## 5. 班级规模设计

| 参数 | 值 |
|------|------|
| 最小成班人数 | 10（绝对下限），默认 15 |
| 推荐人数 | 30-40（最佳活跃度） |
| 最大人数 | 60（系统硬限制） |
| 每人最多加入 | 5 个班级 |

---

## 6. 开发阶段（5 个阶段，10 周）

### 第一阶段（1-2 周）：基础框架 + 用户认证
- 项目骨架（Express + uni-app + docker-compose）
- 微信登录 → JWT → 个人资料 CRUD
- **交付**：用户可登录、编辑资料、进入首页

### 第二阶段（3-4 周）：班级 + 拼班
- 班级 CRUD、邀请码、拼班逻辑、状态机
- Socket.IO 基础连接 + 拼班进度实时推送
- 微信分享卡片
- **交付**：完整拼班流程可用

### 第三阶段（5-6 周）：群聊 + 好友 + 私聊
- 消息收发（WebSocket）、历史消息、未读计数
- 好友关系（闺蜜/兄弟）+ 私聊
- 图片上传
- **交付**：班级群聊、私聊功能可用

### 第四阶段（7-8 周）：选举系统
- 提名 → 投票 → 公示 → 就职全流程
- 实时票数更新、权限控制
- **交付**：班委选举功能可用

### 第五阶段（9-10 周）：会议 + 打磨
- 会议/话题管理、会议专属讨论区
- 全局打磨：限流、敏感词、加载态、微信订阅消息
- **交付**：完整 MVP，可提交小程序审核

---

## 7. 关键设计决策

- **PostgreSQL 存消息**：MVP 阶段规模可控，ACID 保证一致性，后期可迁移
- **Socket.IO**：自动重连 + 房间管理，配合 `weapp-socket.io` 适配器在小程序端使用
- **Redis 用途**：在线状态、未读计数、请求限流、拼班/选举定时任务
- **去标签化**：不存学校/地区/真实姓名，班级名禁止含学校名（正则+审核），聊天中软提示

---

## 8. 验证方式

- 后端：每个模块编写单元测试（vitest/jest），拼班和选举流程编写集成测试
- 前端：`npx tsc --noEmit` 类型检查通过
- 全流程：手动测试 — 登录 → 创建班级 → 分享 → 拼班 → 群聊 → 加好友 → 私聊 → 选举 → 会议
