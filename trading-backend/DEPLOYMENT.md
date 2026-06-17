# 交易监控后端服务部署指南

## 🚀 部署方案选择

### 方案A：直接运行（适合测试）
### 方案B：systemd服务（推荐Linux服务器）
### 方案C：Docker容器（推荐生产环境）
### 方案D：云函数（无服务器架构）

---

## 📋 前置要求

### 服务器环境
- **操作系统**：Linux Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Python版本**：3.9+ （当前使用3.13.5）
- **内存**：至少512MB
- **网络**：需要能访问Yahoo Finance

### 需要的信息
- 服务器IP地址
- SSH访问权限
- 域名（如果需要）

---

## 方案A：直接运行（最简单）

### 1. 上传文件到服务器
```bash
# 在本地执行
scp -r trading-backend/ user@your-server-ip:/home/user/
scp -r trading-backend/ user@your-server-ip:/var/www/
```

### 2. SSH连接到服务器
```bash
ssh user@your-server-ip
```

### 3. 安装Python依赖
```bash
cd /home/user/trading-backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 4. 启动服务
```bash
# 测试启动
python main.py

# 后台启动（推荐）
nohup python main.py > app.log 2>&1 &
```

### 5. 验证服务
```bash
curl http://localhost:8000
```

---

## 方案B：systemd服务（推荐）

### 1. 创建系统服务文件
```bash
sudo nano /etc/systemd/system/trading-api.service
```

### 2. 服务配置内容
```ini
[Unit]
Description=Trading Monitor API Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/user/trading-backend
Environment="PATH=/home/user/trading-backend/venv/bin"
ExecStart=/home/user/trading-backend/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/trading-api/output.log
StandardError=append:/var/log/trading-api/error.log

[Install]
WantedBy=multi-user.target
```

### 3. 启用和启动服务
```bash
# 重载systemd配置
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable trading-api

# 启动服务
sudo systemctl start trading-api

# 查看状态
sudo systemctl status trading-api

# 查看日志
sudo journalctl -u trading-api -f
```

### 4. 服务管理命令
```bash
# 启动
sudo systemctl start trading-api

# 停止
sudo systemctl stop trading-api

# 重启
sudo systemctl restart trading-api

# 查看日志
sudo journalctl -u trading-api -n 50
```

---

## 方案C：Docker容器（生产环境推荐）

### 1. 创建Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. 构建和运行
```bash
# 构建镜像
docker build -t trading-api:latest .

# 运行容器
docker run -d \
  --name trading-api \
  -p 8000:8000 \
  --restart unless-stopped \
  trading-api:latest

# 查看日志
docker logs -f trading-api

# 停止容器
docker stop trading-api

# 重启容器
docker restart trading-api
```

### 3. Docker Compose（推荐）
```yaml
version: '3.8'

services:
  trading-api:
    build: .
    container_name: trading-api
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - trading-network

networks:
  trading-network:
    driver: bridge
```

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 🔧 前端配置更新

### 修改API地址
```bash
# 在前端项目根目录创建或编辑 .env.local
echo "VITE_API_URL=http://your-server-ip:8000" > .env.local
```

### 或者直接修改config.js
```javascript
// src/utils/config.js
export const API_BASE_URL = 'http://your-server-ip:8000'
```

### 重新构建前端
```bash
npm run build
# 或如果是开发环境
npm run dev
```

---

## 🔒 安全配置

### 1. 防火墙配置
```bash
# 开放8000端口
sudo ufw allow 8000
sudo ufw enable
```

### 2. 使用Nginx反向代理（推荐）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache off;
    }
}
```

### 3. 使用HTTPS（推荐生产环境）
```bash
# 安装certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com
```

---

## 📊 监控和日志

### 1. 日志管理
```bash
# 查看应用日志
tail -f /var/log/trading-api/output.log

# 查看错误日志
tail -f /var/log/trading-api/error.log
```

### 2. 性能监控
```bash
# 查看API响应
curl -w "@curl_format_total" -o /dev/null -s \
  http://your-server-ip:8000/api/price/gold

# 监控资源使用
htop
```

### 3. 自动重启监控
```bash
# 安装监控工具
pip install watchdog

# 修改main.py添加健康检查端点
```

---

## 🛠️ 故障排查

### 问题1：端口被占用
```bash
# 查看端口占用
sudo netstat -tlnp | grep 8000

# 杀死占用进程
sudo kill -9 PID
```

### 问题2：权限错误
```bash
# 修改文件权限
chmod +x main.py

# 修改目录权限
chmod -R 755 trading-backend/
```

### 问题3：依赖安装失败
```bash
# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

## 🎯 快速部署脚本

### 一键部署脚本（systemd）
```bash
#!/bin/bash
# deploy.sh

echo "开始部署交易监控API..."

# 安装依赖
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv

# 创建虚拟环境
cd trading-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 创建systemd服务
sudo tee /etc/systemd/system/trading-api.service <<EOF
[Unit]
Description=Trading Monitor API Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment="PATH=$(pwd)/venv/bin"
ExecStart=$(pwd)/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable trading-api
sudo systemctl start trading-api

echo "部署完成！"
echo "服务地址: http://$(curl -s ifconfig.me):8000"
echo "API文档: http://$(curl -s ifconfig.me):8000/docs"
```

---

## 📱 部署后验证

### 1. 检查服务状态
```bash
# 检查服务
curl http://your-server-ip:8000/health

# 测试价格API
curl http://your-server-ip:8000/api/price/gold

# 测试均线API
curl "http://your-server-ip:8000/api/ma/gold?short=10&medium=20&long=30"
```

### 2. 更新前端配置
```bash
# 修改前端API地址
echo "VITE_API_URL=http://your-server-ip:8000" > .env.local

# 重新构建前端
npm run build
```

---

## 🎉 选择建议

- **测试环境**：方案A（直接运行）
- **生产环境**：方案B（systemd）或方案C（Docker）
- **云服务器**：根据云平台选择对应方案
- **有域名**：建议配合Nginx + HTTPS

部署完成后，告诉我你的方案选择，我可以提供更详细的指导！
