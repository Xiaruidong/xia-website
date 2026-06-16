from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

# 导入路由
from routes import price_routes, ma_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    print("交易监控系统启动中...")
    yield
    # 关闭时执行
    print("交易监控系统关闭")

# 创建FastAPI应用
app = FastAPI(
    title="交易监控系统API",
    description="提供黄金、白银、原油等商品期货价格数据和均线分析",
    version="1.0.0",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://your-website.com",  # 替换为你的实际网站域名
        "http://your-website.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(price_routes.router, prefix="/api", tags=["价格数据"])
app.include_router(ma_routes.router, prefix="/api", tags=["均线分析"])

# 根路径
@app.get("/")
async def root():
    return {
        "message": "交易监控系统API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "价格数据": "/api/price/{symbol}",
            "均线数据": "/api/ma/{symbol}"
        }
    }

# 健康检查
@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    # 启动服务器
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 开发模式，代码修改自动重载
        log_level="info"
    )
