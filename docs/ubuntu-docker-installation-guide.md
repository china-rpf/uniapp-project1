# Ubuntu 安装 Docker 完整指南

## 一、安装步骤

### 1. 卸载旧版本（如果有）

```bash
sudo apt remove docker docker-engine docker.io containerd runc
```

### 2. 安装依赖

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
```

### 3. 创建密钥目录并添加 Docker GPG 密钥（使用国内镜像）

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### 4. 配置 Docker 软件源（使用国内镜像）

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 5. 安装 Docker

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 6. 启动并设置开机自启

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 7. 配置非 root 用户可运行 docker（可选）

```bash
sudo usermod -aG docker $USER
```

> 重新登录后生效

### 8. 配置镜像加速器（国内必须）

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 9. 验证安装

```bash
docker --version
docker compose version
```

---

## 二、常见问题及解决方案

### 问题 1：GPG 公钥缺失

**错误信息：**
```
NO_PUBKEY 7EA0A9C3F273FCD8
The repository 'https://download.docker.com/linux/ubuntu noble InRelease' is not signed.
```

**原因：** Docker 官方源 GPG 密钥丢失或未正确添加

**解决方案：** 使用国内镜像源重新添加 GPG 密钥（见步骤 3）

---

### 问题 2：无法连接 Docker 官方源

**错误信息：**
```
curl: (35) Recv failure: Connection reset by peer
gpg: no valid OpenPGP data found.
```

**原因：** 国内网络无法访问 `download.docker.com`

**解决方案：** 使用国内镜像（阿里云/清华）：
```bash
# 阿里云
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 或清华
curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

---

### 问题 3：旧的 Docker 源冲突

**错误信息：**
```
Err:6 https://download.docker.com/linux/ubuntu noble InRelease
```

**原因：** 系统中存在旧的 Docker 源配置文件

**解决方案：** 删除旧的源文件
```bash
# 查找所有 docker 相关源文件
ls /etc/apt/sources.list.d/ | grep -i docker

# 删除旧源文件
sudo rm /etc/apt/sources.list.d/archive_uri-https_download_docker_com_linux_ubuntu-*.list
sudo rm /etc/apt/sources.list.d/docker-ce.list 2>/dev/null

# 重新创建正确的源
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
```

---

### 问题 4：无法拉取镜像

**错误信息：**
```
Error response from daemon: ... connection refused
dial tcp xxx:443: connect: connection refused
```

**原因：** 国内无法直接访问 Docker Hub (`registry-1.docker.io`)

**解决方案：** 配置镜像加速器（见步骤 8）

---

### 问题 5：Docker 服务未启动

**错误信息：**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**解决方案：**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 三、可用国内镜像源

### Docker CE 软件源（安装用）

| 镜像源 | 地址 |
|--------|------|
| 阿里云 | `https://mirrors.aliyun.com/docker-ce/linux/ubuntu` |
| 清华 | `https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu` |

### Docker Hub 镜像加速器（拉取镜像用）

| 镜像加速器 | 地址 |
|------------|------|
| 1ms.run | `https://docker.1ms.run` |
| xuanyuan | `https://docker.xuanyuan.me` |

> 注意：镜像加速器地址可能会变动，如果失效请搜索最新的可用地址

---

## 四、常用命令

```bash
# 查看 Docker 版本
docker --version

# 查看 Docker Compose 版本
docker compose version

# 查看 Docker 服务状态
sudo systemctl status docker

# 拉取镜像
docker pull <镜像名>:<标签>

# 查看本地镜像
docker images

# 运行容器
docker run -d --name <容器名> <镜像名>

# 查看运行中的容器
docker ps

# 查看所有容器
docker ps -a

# 使用 docker-compose 启动服务
docker compose up -d

# 停止服务
docker compose down

# 查看容器日志
docker logs <容器名>
```

---

## 五、卸载 Docker（如需要）

```bash
sudo apt purge docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-ce-rootless-extras
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
sudo rm /etc/apt/sources.list.d/docker.list
sudo rm /etc/apt/keyrings/docker.gpg
```
