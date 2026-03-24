# Push Frontend

强制推送前端代码到服务器（忽略变更检测)。

## 执行步骤

```bash
cd f:/uniapp-project/deploy && node cli.js push:frontend
```

## 使用场景

- 前端代码没有变更但想重新部署
- 想要强制刷新前端静态文件

## 说明

此命令会跳过变更检测，强制重新上传和部署前端代码。

## 相关命令

- `/push` - 智能部署 (推荐)
- `/push-backend` - 强制推送后端
