# 交易监控系统后端API

基于FastAPI和Yahoo Finance的商品期货价格监控服务。

## 功能特性

- ✅ 支持多种商品期货（黄金、白银、原油、铜等）
- ✅ 实时价格数据获取
- ✅ 移动平均线计算和分析
- ✅ 交易信号生成
- ✅ 历史数据查询
- ✅ CORS支持，可直接从前端调用

## 技术栈

- **FastAPI**: 高性能Python Web框架
- **yfinance**: Yahoo Finance数据接口
- **pandas**: 数据处理和分析
- **uvicorn**: ASGI服务器

## 快速开始

### 1. 安装依赖

```bash
cd trading-backend
pip install -r requirements.txt
```

### 2. 启动服务

```bash
python main.py
```

服务将在 http://localhost:8000 启动

### 3. 测试API

访问 http://localhost:8000/docs 查看API文档

## API端点

### 价格数据

**获取实时价格**
```
GET /api/price/{symbol}
```

参数:
- `symbol`: 商品代码 (gold, gold_etf, silver, oil, copper等)

示例:
```bash
curl http://localhost:8000/api/price/gold
```

### 均线分析

**获取均线数据**
```
GET /api/ma/{symbol}
```

参数:
- `symbol`: 商品代码
- `short`: 短期均线周期 (默认5)
- `medium`: 中期均线周期 (默认20)
- `long`: 长期均线周期 (默认60)

示例:
```bash
curl "http://localhost:8000/api/ma/gold?short=5&medium=20&long=60"
```

## 支持的商品

| 代码 | 名称 | Yahoo代码 |
|------|------|-----------|
| gold | 黄金期货 | GC=F |
| gold_etf | 黄金ETF | GLD |
| silver | 白银期货 | SI=F |
| oil | 原油期货 | CL=F |
| copper | 铜期货 | HG=F |

## 配置CORS

在 `main.py` 中修改CORS配置，添加你的前端域名：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-website.com",  # 替换为你的实际域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 服务器部署

### 使用systemd (Linux)

1. 创建服务文件 `/etc/systemd/system/trading-api.service`:

```ini
[Unit]
Description=Trading Monitor API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/trading-backend
ExecStart=/usr/bin/python /path/to/trading-backend/main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

2. 启动服务:
```bash
sudo systemctl start trading-api
sudo systemctl enable trading-api
```

### 使用Docker

1. 创建 `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. 构建和运行:
```bash
docker build -t trading-api .
docker run -p 8000:8000 trading-api
```

### 使用Nginx反向代理

```nginx
location /api/ {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_cache off;
}
```

## 数据说明

- **数据来源**: Yahoo Finance
- **更新频率**: 取决于Yahoo Finance（通常15-20分钟延迟）
- **数据延迟**: 非实时数据，仅供模拟交易参考
- **免责声明**: 本API提供的数据不构成投资建议

## 故障排查

### 1. 数据获取失败

**问题**: 无法获取价格数据

**解决方案**:
- 检查网络连接
- 确认Yahoo Finance服务正常
- 尝试更换商品代码

### 2. CORS错误

**问题**: 前端请求被CORS阻止

**解决方案**:
- 检查`main.py`中的CORS配置
- 确保前端域名已添加到`allow_origins`

### 3. 性能问题

**问题**: API响应慢

**解决方案**:
- 使用缓存减少Yahoo Finance请求
- 考虑使用Redis缓存数据
- 增加请求间隔时间

## 开发计划

- [ ] 添加数据缓存功能
- [ ] 支持更多商品品种
- [ ] 添加技术指标（RSI、MACD等）
- [ ] 实现策略回测功能
- [ ] 添加价格告警功能

## 联系方式

如有问题或建议，请提交Issue。
