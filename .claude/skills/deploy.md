# Deploy All

部署前后端服务到远程服务器。

## 执行步骤

1. 进入 deploy 目录
2. 运行完整部署命令

```bash
cd f:/uniapp-project/deploy && node cli.js deploy:all
```

## 说明

此命令会：
- 部署后端 Node.js 服务 (PM2)
- 部署前端静态文件 (Nginx)
- 运行数据库迁移
- 配置反向代理

## 部署完成后访问

- 前端: http://192.168.1.5
- 后端: http://192.168.1.5:3000
- API: http://192.168.1.5/api
