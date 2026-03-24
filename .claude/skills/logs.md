# Logs

查看后端服务日志。

## 执行步骤

```bash
cd f:/uniapp-project/deploy && node cli.js logs
```

## 说明

显示 PM2 管理的后端服务最近 50 行日志。

## 实时查看日志

如需实时查看日志，可直接 SSH 到服务器：

```bash
ssh renpengfei@192.168.1.5
pm2 logs vc
```

## 相关命令

- `/status` - 查看服务状态
- `/restart` - 重启服务
