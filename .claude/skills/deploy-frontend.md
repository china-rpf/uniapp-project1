# Deploy Frontend

部署前端服务到远程服务器。

## 执行步骤

1. 确保前端代码已构建 (`npm run build`)
2. 进入 deploy 目录运行前端部署

```bash
cd f:/uniapp-project/deploy && node cli.js deploy:frontend
```

## 说明

此命令会：
- 打包 `client/dist/` 目录
- 上传到服务器 Nginx 目录
- 配置 Nginx 反向代理

## 相关命令

- `/deploy` - 部署前后端
- `/deploy-backend` - 只部署后端
- `/status` - 查看服务状态
