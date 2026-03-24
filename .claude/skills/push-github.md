# Push to GitHub

将代码推送到 GitHub 仓库。

## 使用场景

- 当用户说"推送代码"、"上传代码到GitHub"、"push到远程"时触发
- 当用户完成功能开发后想要备份代码时

## 执行步骤

1. 检查是否有未提交的更改
2. 如果有更改，创建提交
3. 拉取远程更新（避免冲突）
4. 推送到 GitHub

## 代码

```bash
# 检查状态
git status

# 如果有更改，添加并提交
git add .
git commit -m "feat: update code"

# 拉取远程更新
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes" git pull origin main

# 推送到远程
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes" git push origin main
```

## 注意事项

- 使用 SSH 密钥 `~/.ssh/github_key` 进行认证
- GitHub 仓库地址: `git@github.com:china-rpf/uniapp-project1.git`
- 用户名: renpengfei
- 邮箱: 13571804740@163.com
