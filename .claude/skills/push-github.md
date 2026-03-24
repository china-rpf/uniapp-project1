# Push to GitHub

将代码推送到 GitHub 仓库。

## 使用场景

- 当用户说"推送代码"、"上传代码到GitHub"、"push到远程"时触发
- 当用户完成功能开发后想要备份代码时

## 执行步骤

1. 检查是否有未提交的更改
2. 分析变更内容，生成规范的提交信息
3. 创建提交（包含修改问题、问题根因、修复内容）
4. 拉取远程更新（避免冲突）
5. 推送到 GitHub

## 提交信息模板

提交信息必须包含以下三部分：

```
<type>: <简短描述>

修改问题:
<描述这次修改解决了什么问题或添加了什么功能>

问题根因:
<描述问题的根本原因是什么>

修复内容:
- <具体修改项1>
- <具体修改项2>
- ...
```

### Type 类型说明
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构代码
- `style`: 样式修改
- `docs`: 文档更新
- `chore`: 构建/工具变动

### 示例

```
fix: 修复聊天图片显示绿色背景问题

修改问题:
聊天气泡中的图片周围显示绿色背景，影响美观

问题根因:
图片被包裹在 msg-bubble bubble-right 元素中，该元素有绿色背景色

修复内容:
- 将图片元素移出 msg-bubble 容器
- 图片直接显示，不再继承气泡背景色
- 添加 markAsRead 方法消除未读提示
```

## 代码

```bash
# 检查状态
git status

# 查看变更内容
git diff

# 如果有更改，添加并提交（使用规范提交信息）
git add .
git commit -m "<type>: <描述>

修改问题:
<问题描述>

问题根因:
<根因分析>

修复内容:
- <修改项>"

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
- 提交前必须分析代码变更，生成详细的提交信息
