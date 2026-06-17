#!/bin/bash
# 交易监控API一键部署脚本

set -e

echo "🚀 开始部署交易监控API服务..."

# 检查Python版本
echo "📋 检查Python版本..."
python3 --version || { echo "❌ Python3未安装"; exit 1; }

# 安装系统依赖
echo "📦 安装系统依赖..."
sudo apt-get update
sudo apt-get install -y python3-venv

# 进入项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 当前目录: $SCRIPT_DIR"

# 创建虚拟环境
echo "🔧 创建Python虚拟环境..."
python3 -m venv venv
source venv/bin/activate

# 安装Python依赖
echo "📦 安装Python依赖..."
pip install --upgrade pip
pip install -r requirements.txt

# 获取服务器IP
echo "🌐 获取服务器IP..."
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
echo "服务器IP: $SERVER_IP"

# 创建systemd服务文件
echo "⚙️  创建systemd服务..."
sudo tee /etc/systemd/system/trading-api.service > /dev/null <<EOF
[Unit]
Description=Trading Monitor API Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR
Environment="PATH=$SCRIPT_DIR/venv/bin"
ExecStart=$SCRIPT_DIR/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/trading-api/output.log
StandardError=append:/var/log/trading-api/error.log

[Install]
WantedBy=multi-user.target
EOF

# 重载systemd配置
echo "🔄 重载systemd配置..."
sudo systemctl daemon-reload

# 启用服务
echo "✅ 启用trading-api服务..."
sudo systemctl enable trading-api

# 启动服务
echo "🎯 启动服务..."
sudo systemctl start trading-api

# 等待服务启动
sleep 3

# 检查服务状态
if sudo systemctl is-active --quiet trading-api; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "📊 服务信息："
    echo "  服务地址: http://$SERVER_IP:8000"
    echo "  API文档: http://$SERVER_IP:8000/docs"
    echo "  健康检查: http://$SERVER_IP:8000/health"
    echo ""
    echo "🔧 服务管理命令："
    echo "  启动: sudo systemctl start trading-api"
    echo "  停止: sudo systemctl stop trading-api"
    echo "  重启: sudo systemctl restart trading-api"
    echo "  查看状态: sudo systemctl status trading-api"
    echo "  查看日志: sudo journalctl -u trading-api -f"
    echo ""
    echo "📋 快速测试："
    echo "  curl http://$SERVER_IP:8000/api/price/gold"
else
    echo "❌ 服务启动失败，请检查日志："
    echo "  sudo journalctl -u trading-api -n 50"
    exit 1
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "⚙️  下一步："
echo "1. 修改前端API地址为: http://$SERVER_IP:8000"
echo "2. 重新构建前端应用"
echo "3. 访问页面测试连接"