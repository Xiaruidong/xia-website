# 招聘爬虫工具 - 快速开始指南

## 功能特性

✅ 支持微信公众号文章爬取（国资小新、神仙外企等）
✅ 智能提取招聘信息（企业名称、性质、行业、岗位、地点、截止时间、投递链接）
✅ 实时状态监控和日志显示
✅ Excel 格式导出
✅ 可扩展的渠道配置

## 快速开始

### 1️⃣ 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

如果安装速度慢，可以使用国内镜像：

```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 2️⃣ 启动后端服务

```bash
cd backend
python app.py
```

看到以下输出表示启动成功：

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3️⃣ 启动前端（如果还没启动）

```bash
cd d:/vue_project/xrd
npm run dev
```

### 4️⃣ 访问爬虫工具

打开浏览器访问：http://localhost:5174/xia-website/job-crawler

## 使用步骤

1. **选择爬取渠道**
   - 推荐使用微信公众号：国资小新、神仙外企
   - 也可选择国企官网或大厂官网

2. **配置爬取规则**
   - 重试次数：3（默认）
   - 请求间隔：2秒（默认）
   - 超时时间：30秒（默认）
   - 每个来源最多爬取文章数：10（默认）

3. **启动爬虫**
   - 点击"▶ 启动爬虫"按钮
   - 查看实时日志和进度
   - 等待爬取完成

4. **查看结果**
   - 爬取完成后，结果会显示在表格中
   - 支持搜索、筛选、排序

5. **导出 Excel**
   - 点击"📊 导出 Excel"按钮
   - 下载生成的 Excel 文件

## 表格格式

导出的 Excel 表格包含以下列：

| 列名 | 说明 |
|------|------|
| 更新/开启时间 | 职位发布或更新时间 |
| 企业名称 | 招聘企业名称 |
| 企业性质 | 国央企/民企/外企等 |
| 行业分类 | 互联网/金融/能源等 |
| 招聘类型 | 校招/社招/实习 |
| 招聘岗位 | 具体职位名称 |
| 工作地点 | 工作城市 |
| 网申截止时间 | 投递截止日期 |
| 投递链接 | 简历投递链接 |

## 注意事项

⚠️ **关于微信公众号爬取**：

由于微信的反爬机制，直接爬取公众号文章有一定限制。本工具使用了搜狗微信搜索作为中间层，但请注意：

1. 搜狗微信有访问频率限制
2. 可能需要配置搜狗账号的 Cookie
3. 部分公众号可能无法搜索到

**解决方案**：
- 增加请求间隔时间（建议 5-10 秒）
- 使用代理 IP 池
- 手动提供公众号文章链接进行爬取

⚠️ **数据准确性**：

AI 提取的数据可能存在误差，建议：
1. 人工审核重要信息
2. 根据实际情况调整提取规则
3. 定期验证投递链接的有效性

## 扩展功能

### 添加新的公众号

在 `backend/app.py` 中的 `WeChatArticleScraper` 类添加自定义爬取逻辑：

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

### 添加数据持久化

集成数据库存储（SQLite/MySQL/PostgreSQL）：

```bash
pip install sqlalchemy
```

然后在代码中添加数据库操作。

## 常见问题

**Q: 后端启动失败？**

A: 检查 Python 版本（需要 3.8+），确保所有依赖已安装。

**Q: 无法爬取到数据？**

A: 检查网络连接，确认后端服务正常运行，查看日志了解具体错误。

**Q: Excel 导出失败？**

A: 确保已安装 `openpyxl` 库，检查是否有写入权限。

**Q: 如何停止爬虫？**

A: 点击"⏹ 停止"按钮即可。

## 技术支持

如有问题，请查看：
- 后端文档：`backend/README.md`
- API 文档：http://localhost:8000/docs（启动后端后访问）
- 日志面板：前端页面底部的日志区域

祝使用愉快！🎉
