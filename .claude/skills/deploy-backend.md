# Deploy Backend

部署后端服务到远程服务器。

## 执行步骤

1. 确保后端代码已编译 (`npm run build`)
2. 进入 deploy 目录运行后端部署

```bash
cd f:/uniapp-project/deploy && node cli.js deploy:backend
```

## 说明

此命令会：
- 上传 `server/dist/` 和 `server/migrations/`
- 安装 npm 依赖包
- 运行数据库迁移
- 使用 PM2 重启服务

## 相关命令

- `/deploy` - 部署前后端
- `/deploy-frontend` - 只部署前端
- `/status` - 查看服务状态
- `/logs` - 查看后端日志
