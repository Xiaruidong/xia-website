# 交易监控系统快速启动指南

## 🚀 快速开始

### 1. 启动后端服务

```bash
# 进入后端目录
cd trading-backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

后端服务将在 http://localhost:8000 启动

访问 http://localhost:8000/docs 查看API文档

### 2. 配置前端API地址

创建前端环境配置文件：

```bash
# 在项目根目录创建 .env.local 文件
echo "VITE_API_URL=http://localhost:8000" > .env.local
```

### 3. 启动前端服务

```bash
# 返回项目根目录
cd ..

# 启动前端开发服务器
npm run dev
```

访问 http://localhost:5173/xia-website/gold-price 查看交易监控页面

## 📋 支持的交易品种

| 代码 | 名称 | 说明 |
|------|------|------|
| gold | 黄金现货 | 主要监控品种 |
| gold_etf | 黄金ETF (GLD) | 备选品种 |
| silver | 白银期货 | 扩展品种 |
| oil | 原油期货 | 扩展品种 |

## 🔧 API端点

### 获取价格数据
```bash
GET http://localhost:8000/api/price/{symbol}
```

### 获取均线数据
```bash
GET http://localhost:8000/api/ma/{symbol}?short=5&medium=20&long=60
```

## ⚙️ 配置说明

### 修改CORS设置

编辑 `trading-backend/main.py` 中的CORS配置：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-website.com",  # 添加你的生产环境域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 添加新的交易品种

编辑 `trading-backend/routes/price_routes.py`：

```python
SYMBOL_MAP = {
    'your_symbol': 'YAHOO_CODE',
    # ... 其他品种
}
```

编辑 `src/utils/config.js`：

```javascript
export const TRADING_SYMBOLS = [
  { id: 'your_symbol', name: '品种名称', symbol: '代码', type: 'future' },
  // ... 其他品种
]
```

## 🔍 测试API

### 使用curl测试

```bash
# 测试价格接口
curl http://localhost:8000/api/price/gold

# 测试均线接口
curl "http://localhost:8000/api/ma/gold?short=5&medium=20&long=60"
```

### 使用浏览器测试

直接访问 http://localhost:8000/docs 可以使用Swagger UI测试所有API

## 📊 数据说明

- **数据延迟**: 15-20分钟（Yahoo Finance限制）
- **更新频率**: 每15秒自动刷新
- **数据来源**: Yahoo Finance
- **免责声明**: 仅供模拟交易学习，不构成投资建议

## 🐛 常见问题

### 1. 后端无法启动

**问题**: `ModuleNotFoundError: No module named 'fastapi'`

**解决**: 确保已安装所有依赖 `pip install -r requirements.txt`

### 2. 前端连接失败

**问题**: `获取数据失败，请检查后端服务是否启动`

**解决**:
- 确认后端服务已启动 (http://localhost:8000)
- 检查CORS配置是否包含前端地址
- 查看浏览器控制台的具体错误信息

### 3. 数据获取失败

**问题**: Yahoo Finance数据获取失败

**解决**:
- 检查网络连接
- 确认Yahoo Finance服务正常
- 尝试更换其他商品代码测试

## 🚀 部署到服务器

详细的部署说明请查看 [trading-backend/README.md](trading-backend/README.md)

## 📞 技术支持

如有问题，请提交GitHub Issue。
