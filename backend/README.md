# 招聘爬虫后端服务

## 功能说明

这是一个基于 FastAPI 的招聘信息爬虫后端服务，支持：
- 微信公众号文章爬取
- 招聘信息智能提取
- Excel 格式导出
- 实时日志和进度监控

## 技术栈

- **FastAPI**: 高性能异步 Web 框架
- **aiohttp**: 异步 HTTP 客户端
- **BeautifulSoup4**: HTML 解析
- **Pandas**: 数据处理和 Excel 导出
- **Pydantic**: 数据验证

## 安装步骤

### 1. 安装 Python

确保已安装 Python 3.8 或更高版本：
```bash
python --version
```

### 2. 创建虚拟环境（推荐）

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

## 运行服务

### 开发模式

```bash
python app.py
```

或使用 uvicorn：

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 生产模式

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

服务启动后访问：http://localhost:8000

## API 文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端点

### POST /api/crawler/start
启动爬虫任务

**请求体：**
```json
{
  "sources": ["国资小新", "神仙外企"],
  "retry_count": 3,
  "request_interval": 2,
  "timeout": 30,
  "max_articles": 10
}
```

**响应：**
```json
{
  "success": true,
  "total_jobs": 50,
  "jobs": [...],
  "message": "成功爬取 50 个职位"
}
```

### GET /api/crawler/status
获取爬虫状态

**响应：**
```json
{
  "running": false,
  "progress": 100,
  "crawled_count": 10,
  "link_count": 50,
  "valid_link_count": 45,
  "current_source": "神仙外企",
  "logs": [...]
}
```

### GET /api/crawler/result
获取爬取结果

**响应：**
```json
{
  "jobs": [
    {
      "update_time": "2026-05-15",
      "company_name": "中国石油",
      "company_nature": "国央企",
      "industry": "能源",
      "recruitment_type": "校招",
      "position": "软件工程师",
      "location": "北京",
      "deadline": "2026-06-30",
      "apply_link": "https://..."
    }
  ]
}
```

### GET /api/crawler/export
导出 Excel

返回下载文件：`招聘信息_20260515_101030.xlsx`

### POST /api/crawler/stop
停止爬虫任务

## 使用示例

### 使用 curl

```bash
# 启动爬虫
curl -X POST "http://localhost:8000/api/crawler/start" \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["国资小新", "神仙外企"],
    "max_articles": 10
  }'

# 查看状态
curl "http://localhost:8000/api/crawler/status"

# 导出Excel
curl "http://localhost:8000/api/crawler/export" --output jobs.xlsx
```

### 使用 JavaScript (前端)

```javascript
// 启动爬虫
const response = await fetch('http://localhost:8000/api/crawler/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sources: ['国资小新', '神仙外企'],
    max_articles: 10
  })
});

const result = await response.json();
console.log(result);

// 查看状态
const status = await fetch('http://localhost:8000/api/crawler/status');
const statusData = await status.json();
console.log(statusData);

// 导出Excel
window.location.href = 'http://localhost:8000/api/crawler/export';
```

## 配置说明

### 爬虫配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| sources | List[str] | 必填 | 爬取来源（公众号名称或URL） |
| retry_count | int | 3 | 重试次数 |
| request_interval | int | 2 | 请求间隔（秒） |
| timeout | int | 30 | 超时时间（秒） |
| max_articles | int | 10 | 每个来源最多爬取文章数 |

### Excel 导出格式

导出的 Excel 表格包含以下列：

1. **更新/开启时间**: 职位发布或更新时间
2. **企业名称**: 招聘企业名称
3. **企业性质**: 国央企/民企/外企等
4. **行业分类**: 互联网/金融/能源等
5. **招聘类型**: 校招/社招/实习
6. **招聘岗位**: 具体职位名称
7. **工作地点**: 工作城市
8. **网申截止时间**: 投递截止日期
9. **投递链接**: 简历投递链接

## 注意事项

1. **反爬机制**: 微信公众号有反爬机制，建议：
   - 设置合理的请求间隔（2-5秒）
   - 不要频繁请求
   - 使用代理 IP（可选）

2. **搜狗微信限制**:
   - 搜狗微信搜索有访问频率限制
   - 建议添加 Cookie 或使用账号登录
   - 可考虑使用其他数据源

3. **数据准确性**:
   - AI 提取的数据可能存在误差
   - 建议人工审核重要信息
   - 可根据需要调整提取规则

4. **合规性**:
   - 仅爬取公开的招聘信息
   - 遵守网站 robots 协议
   - 不用于商业用途

## 故障排除

### 问题：无法获取公众号文章

**解决方案**：
1. 检查网络连接
2. 增加超时时间
3. 使用搜狗微信账号 Cookie
4. 考虑使用其他数据源

### 问题：提取的职位信息不准确

**解决方案**：
1. 调整正则表达式
2. 增加关键词匹配规则
3. 优化 HTML 解析逻辑
4. 考虑使用 NLP 模型

### 问题：Excel 导出失败

**解决方案**：
1. 检查是否安装 openpyxl
2. 确保有写入权限
3. 检查数据格式是否正确

## 扩展功能

### 添加新的数据源

在 `WeChatArticleScraper` 类中添加新的爬取方法：

```python
async def crawl_custom_source(self, source: str) -> List[str]:
    """自定义数据源爬取"""
    # 实现你的爬取逻辑
    pass
```

### 自定义提取规则

修改 `extract_job_info` 方法中的提取逻辑：

```python
def _extract_positions(self, text: str) -> List[str]:
    """自定义岗位提取规则"""
    # 添加你的正则表达式或匹配规则
    pass
```

### 数据库存储

添加数据库持久化：

```python
# 安装依赖
# pip install sqlalchemy

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 创建数据库连接
engine = create_engine('sqlite:///jobs.db')
Session = sessionmaker(bind=engine)

# 保存到数据库
def save_to_db(jobs: List[JobInfo]):
    session = Session()
    for job in jobs:
        # 保存逻辑
        pass
    session.commit()
```

## 许可证

MIT License
