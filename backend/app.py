"""
招聘信息爬虫后端服务
支持微信公众号文章爬取、招聘信息提取、Excel导出
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from datetime import datetime
import asyncio
import aiohttp
from bs4 import BeautifulSoup
import re
import json
import os

app = FastAPI(title="招聘爬虫API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class CrawlerConfig(BaseModel):
    """爬虫配置"""
    sources: List[str]  # 爬取来源（公众号名称或URL）
    retry_count: int = 3
    request_interval: int = 2
    timeout: int = 30
    max_articles: int = 10  # 每个来源最多爬取文章数


class JobInfo(BaseModel):
    """招聘信息"""
    update_time: str  # 更新/开启时间
    company_name: str  # 企业名称
    company_nature: str  # 企业性质（国央企/民企/外企等）
    industry: str  # 行业分类
    recruitment_type: str  # 招聘类型（校招/社招/实习）
    position: str  # 招聘岗位
    location: str  # 工作地点
    deadline: str  # 网申截止时间
    apply_link: str  # 投递链接


class CrawlerResult(BaseModel):
    """爬取结果"""
    success: bool
    total_jobs: int
    jobs: List[JobInfo]
    message: str


# 全局存储
crawler_status = {
    "running": False,
    "progress": 0,
    "crawled_count": 0,
    "link_count": 0,
    "valid_link_count": 0,
    "current_source": "",
    "logs": []
}


# 微信公众号文章爬虫
class WeChatArticleScraper:
    """微信公众号文章爬虫"""

    def __init__(self, config: CrawlerConfig):
        self.config = config
        self.session = None
        self.jobs = []

    async def init_session(self):
        """初始化HTTP会话"""
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        self.session = aiohttp.ClientSession(timeout=timeout)

    async def close_session(self):
        """关闭HTTP会话"""
        if self.session:
            await self.session.close()

    def add_log(self, level: str, message: str):
        """添加日志"""
        crawler_status["logs"].append({
            "time": datetime.now().isoformat(),
            "level": level,
            "message": message
        })
        # 保持最近100条日志
        if len(crawler_status["logs"]) > 100:
            crawler_status["logs"].pop(0)

    def update_progress(self, progress: int, current_source: str = ""):
        """更新进度"""
        crawler_status["progress"] = progress
        if current_source:
            crawler_status["current_source"] = current_source

    async def search_sogou_wechat(self, account_name: str) -> List[str]:
        """
        通过搜狗微信搜索获取公众号文章链接
        注意：实际使用需要处理搜狗的反爬机制
        """
        article_urls = []

        try:
            self.add_log("INFO", f"正在搜索公众号: {account_name}")

            # 搜狗微信搜索URL（实际使用时需要更复杂的处理）
            search_url = f"https://weixin.sogou.com/weixin?type=1&query={account_name}&ie=utf8"

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            await asyncio.sleep(self.config.request_interval)

            async with self.session.get(search_url, headers=headers) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')

                    # 提取文章链接（这里需要根据实际页面结构调整）
                    links = soup.find_all('a', href=re.compile(r'mp\.weixin\.qq\.com'))
                    for link in links[:self.config.max_articles]:
                        href = link.get('href', '')
                        if 'mp.weixin.qq.com' in href:
                            article_urls.append(href)

                    self.add_log("INFO", f"找到 {len(article_urls)} 篇文章")
                else:
                    self.add_log("WARN", f"搜狗搜索失败: {response.status}")

        except Exception as e:
            self.add_log("ERROR", f"搜索公众号失败: {str(e)}")

        return article_urls

    async def fetch_article(self, article_url: str) -> Optional[str]:
        """获取微信公众号文章内容"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            await asyncio.sleep(self.config.request_interval)

            async with self.session.get(article_url, headers=headers) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    self.add_log("WARN", f"获取文章失败: {response.status}")
                    return None

        except Exception as e:
            self.add_log("ERROR", f"获取文章异常: {str(e)}")
            return None

    def extract_job_info(self, article_content: str, article_url: str) -> List[JobInfo]:
        """
        从文章内容中提取招聘信息
        使用正则表达式和关键词匹配
        """
        jobs = []
        soup = BeautifulSoup(article_content, 'html.parser')

        # 获取文章内容
        content_div = soup.find('div', class_='rich_media_content')
        if not content_div:
            content_div = soup.find('div', id='js_content')

        if not content_div:
            return jobs

        text = content_div.get_text()

        # 提取更新时间
        update_time = self._extract_update_time(soup, article_content)

        # 提取企业名称（从文章标题或内容中）
        company_name = self._extract_company_name(soup, text)

        # 判断企业性质
        company_nature = self._determine_company_nature(company_name, text)

        # 判断行业分类
        industry = self._determine_industry(text)

        # 判断招聘类型
        recruitment_type = self._determine_recruitment_type(text)

        # 提取招聘岗位
        positions = self._extract_positions(text)

        # 提取工作地点
        locations = self._extract_locations(text)

        # 提取截止时间
        deadline = self._extract_deadline(text)

        # 提取投递链接
        apply_links = self._extract_apply_links(article_content, article_url)

        # 组合生成职位信息
        for i, (position, location) in enumerate(zip(positions, locations)):
            link = apply_links[i] if i < len(apply_links) else (apply_links[0] if apply_links else article_url)

            job = JobInfo(
                update_time=update_time,
                company_name=company_name,
                company_nature=company_nature,
                industry=industry,
                recruitment_type=recruitment_type,
                position=position,
                location=location if location else "全国",
                deadline=deadline,
                apply_link=link
            )
            jobs.append(job)

        return jobs

    def _extract_update_time(self, soup, content: str) -> str:
        """提取更新时间"""
        # 尝试从meta标签获取
        meta_time = soup.find('meta', property='article:published_time')
        if meta_time:
            time_str = meta_time.get('content', '')
            try:
                dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
                return dt.strftime('%Y-%m-%d')
            except:
                pass

        # 尝试从脚本标签获取
        script = soup.find('script', id='wx_script_item')
        if script:
            time_match = re.search(r'ctime["\s:]+(\d+)', str(script))
            if time_match:
                timestamp = int(time_match.group(1))
                dt = datetime.fromtimestamp(timestamp)
                return dt.strftime('%Y-%m-%d')

        # 默认返回当前日期
        return datetime.now().strftime('%Y-%m-%d')

    def _extract_company_name(self, soup, text: str) -> str:
        """提取企业名称"""
        # 从文章标题获取
        title = soup.find('meta', property='og:title')
        if title:
            title_text = title.get('content', '')
            # 尝试从标题中提取公司名
            for keyword in ['招聘', '招贤纳士', '诚聘', '社会招聘', '校园招聘']:
                if keyword in title_text:
                    company = title_text.split(keyword)[0].strip()
                    if company:
                        return company

        # 从内容开头查找
        lines = text.split('\n')[:10]
        for line in lines:
            line = line.strip()
            if line and len(line) < 50 and not any(x in line for x in ['招聘', '岗位', '职位']):
                return line

        return "未知企业"

    def _determine_company_nature(self, company_name: str, text: str) -> str:
        """判断企业性质"""
        # 国企关键词
        soe_keywords = ['集团', '有限公司', '公司', '银行', '石油', '石化', '电网',
                       '移动', '联通', '电信', '铁路', '建筑', '能源', '电力']

        # 央企特征
        if any(kw in company_name for kw in ['中国', '国家']):
            for kw in ['集团', '公司', '银行', '石油', '石化', '电网']:
                if kw in company_name:
                    return '国央企'

        # 从文章内容判断
        if '国企' in text or '央企' in text or '国有' in text:
            return '国央企'

        if '外企' in text or '外资' in text:
            return '外企'

        if '民企' in text or '私企' in text or '民营' in text:
            return '民企'

        # 根据公司名判断
        for kw in soe_keywords:
            if kw in company_name:
                return '国央企'

        return '未知'

    def _determine_industry(self, text: str) -> str:
        """判断行业分类"""
        industries = {
            '互联网': ['互联网', '软件', 'AI', '人工智能', '大数据', '云计算'],
            '金融': ['银行', '证券', '基金', '保险', '金融', '投资'],
            '能源': ['石油', '石化', '电力', '能源', '新能源', '煤炭'],
            '通信': ['通信', '5G', '网络', '运营商'],
            '制造': ['制造', '汽车', '机械', '电子'],
            '建筑': ['建筑', '房地产', '工程', '设计'],
            '交通': ['铁路', '航空', '港口', '物流'],
            '教育': ['教育', '学校', '培训'],
            '医疗': ['医院', '医疗', '医药', '健康']
        }

        for industry, keywords in industries.items():
            if any(kw in text for kw in keywords):
                return industry

        return '其他'

    def _determine_recruitment_type(self, text: str) -> str:
        """判断招聘类型"""
        if '校招' in text or '校园招聘' in text or '应届' in text:
            return '校招'
        elif '社招' in text or '社会招聘' in text or '经验' in text:
            return '社招'
        elif '实习' in text:
            return '实习'
        else:
            return '不限'

    def _extract_positions(self, text: str) -> List[str]:
        """提取招聘岗位"""
        positions = []

        # 常见岗位关键词模式
        patterns = [
            r'([工程师|经理|专员|总监|助理|顾问|师|员]{2,4})',
            r'(开发工程师|软件工程师|产品经理|运营专员|数据分析)',
            r'(Java|Python|C\+\+|前端|后端|算法|测试)[\s]*工程师',
            r'([一二三四五六七八九十]+、[一-龥]{2,10}(岗|位|员|工程师|师))'
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text)
            positions.extend(matches)

        # 去重并限制数量
        positions = list(set(positions))[:20]

        if not positions:
            positions = ['通用岗位']

        return positions

    def _extract_locations(self, text: str) -> List[str]:
        """提取工作地点"""
        locations = []

        # 城市列表
        cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安',
                 '南京', '天津', '苏州', '重庆', '长沙', '郑州', '青岛', '大连']

        for city in cities:
            if city in text:
                locations.append(city)

        # 如果没有找到具体城市，查找"地点"相关
        if not locations:
            location_patterns = [
                r'工作地点[：:]\s*([^\n\r，。；；]{2,20})',
                r'地点[：:]\s*([^\n\r，。；；]{2,20})',
                r'地点[：:]\s*([^\n\r，。；；]{2,20})'
            ]
            for pattern in location_patterns:
                matches = re.findall(pattern, text)
                locations.extend(matches)

        if not locations:
            locations = ['全国']

        # 去重
        locations = list(set(locations))

        return locations

    def _extract_deadline(self, text: str) -> str:
        """提取截止时间"""
        patterns = [
            r'截止时间[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?)',
            r'截止日期[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?)',
            r'网申截止[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?)',
            r'报名截止[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?)',
            r'(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?)\s*截止'
        ]

        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                date_str = match.group(1)
                # 标准化日期格式
                date_str = date_str.replace('年', '-').replace('月', '-').replace('日', '').replace('号', '')
                return date_str

        # 查找相对时间
        if re.search(r'招满即止', text):
            return '招满即止'

        if re.search(r'长期有效', text):
            return '长期有效'

        return '未知'

    def _extract_apply_links(self, content: str, article_url: str) -> List[str]:
        """提取投递链接"""
        links = []

        # 提取所有链接
        soup = BeautifulSoup(content, 'html.parser')
        all_links = soup.find_all('a', href=True)

        # 邮箱链接
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

        for link in all_links:
            href = link.get('href', '')
            text = link.get_text()

            # 查找包含招聘关键词的链接
            keywords = ['apply', 'job', 'career', 'recruit', '招聘', '应聘', '投递']
            if any(kw in href.lower() or kw in text for kw in keywords):
                if href.startswith('http'):
                    links.append(href)

            # 查找邮箱
            emails = re.findall(email_pattern, text)
            links.extend([f'mailto:{email}' for email in emails])

        # 去重
        links = list(set(links))

        return links if links else [article_url]

    async def crawl(self) -> List[JobInfo]:
        """执行爬取任务"""
        all_jobs = []

        try:
            await self.init_session()

            sources = self.config.sources
            total_sources = len(sources)

            for idx, source in enumerate(sources):
                self.update_progress(
                    int((idx / total_sources) * 100),
                    f"正在爬取: {source}"
                )

                self.add_log("INFO", f"开始处理: {source}")

                # 搜索公众号文章
                article_urls = await self.search_sogou_wechat(source)

                if not article_urls:
                    # 如果是直接URL，尝试访问
                    if source.startswith('http'):
                        article_urls = [source]
                    else:
                        self.add_log("WARN", f"未找到 {source} 的文章")
                        continue

                # 爬取文章内容
                for article_idx, article_url in enumerate(article_urls):
                    self.add_log("INFO", f"正在获取文章 {article_idx + 1}/{len(article_urls)}")

                    content = await self.fetch_article(article_url)
                    if content:
                        jobs = self.extract_job_info(content, article_url)
                        all_jobs.extend(jobs)
                        crawler_status["crawled_count"] += 1
                        crawler_status["link_count"] += len(jobs)
                        crawler_status["valid_link_count"] += len(jobs)

                        self.add_log("INFO", f"从文章中提取到 {len(jobs)} 个职位")

                # 更新进度
                self.update_progress(int(((idx + 1) / total_sources) * 100))

        except Exception as e:
            self.add_log("ERROR", f"爬取异常: {str(e)}")
        finally:
            await self.close_session()

        return all_jobs


# API 端点
@app.get("/")
async def root():
    """API根路径"""
    return {
        "message": "招聘爬虫API服务",
        "version": "1.0.0",
        "endpoints": {
            "POST /api/crawler/start": "启动爬虫任务",
            "GET /api/crawler/status": "获取爬虫状态",
            "GET /api/crawler/result": "获取爬取结果",
            "GET /api/crawler/export": "导出Excel",
            "POST /api/crawler/stop": "停止爬虫任务"
        }
    }


@app.post("/api/crawler/start", response_model=CrawlerResult)
async def start_crawler(config: CrawlerConfig):
    """启动爬虫任务"""
    if crawler_status["running"]:
        raise HTTPException(status_code=400, detail="爬虫任务正在运行")

    try:
        # 重置状态
        crawler_status["running"] = True
        crawler_status["progress"] = 0
        crawler_status["crawled_count"] = 0
        crawler_status["link_count"] = 0
        crawler_status["valid_link_count"] = 0
        crawler_status["current_source"] = ""
        crawler_status["logs"] = []

        # 创建爬虫实例
        scraper = WeChatArticleScraper(config)

        # 执行爬取
        jobs = await scraper.crawl()

        # 保存结果
        crawler_status["jobs"] = jobs
        crawler_status["running"] = False

        return CrawlerResult(
            success=True,
            total_jobs=len(jobs),
            jobs=jobs,
            message=f"成功爬取 {len(jobs)} 个职位"
        )

    except Exception as e:
        crawler_status["running"] = False
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/crawler/status")
async def get_crawler_status():
    """获取爬虫状态"""
    return {
        "running": crawler_status["running"],
        "progress": crawler_status["progress"],
        "crawled_count": crawler_status["crawled_count"],
        "link_count": crawler_status["link_count"],
        "valid_link_count": crawler_status["valid_link_count"],
        "current_source": crawler_status["current_source"],
        "logs": crawler_status["logs"][-20:]  # 返回最近20条日志
    }


@app.get("/api/crawler/result")
async def get_crawler_result():
    """获取爬取结果"""
    if "jobs" not in crawler_status:
        return {"jobs": []}

    return {
        "jobs": crawler_status["jobs"]
    }


@app.get("/api/crawler/export")
async def export_to_excel():
    """导出Excel"""
    if "jobs" not in crawler_status or not crawler_status["jobs"]:
        raise HTTPException(status_code=400, detail="没有可导出的数据")

    try:
        # 创建DataFrame
        df = pd.DataFrame([
            {
                "更新/开启时间": job.update_time,
                "企业名称": job.company_name,
                "企业性质": job.company_nature,
                "行业分类": job.industry,
                "招聘类型": job.recruitment_type,
                "招聘岗位": job.position,
                "工作地点": job.location,
                "网申截止时间": job.deadline,
                "投递链接": job.apply_link
            }
            for job in crawler_status["jobs"]
        ])

        # 生成文件名
        filename = f"招聘信息_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        filepath = f"/tmp/{filename}"

        # 保存Excel
        df.to_excel(filepath, index=False, engine='openpyxl')

        # 返回文件
        return FileResponse(
            filepath,
            filename=filename,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")


@app.post("/api/crawler/stop")
async def stop_crawler():
    """停止爬虫任务"""
    if not crawler_status["running"]:
        raise HTTPException(status_code=400, detail="没有正在运行的爬虫任务")

    crawler_status["running"] = False
    crawler_status["progress"] = 0

    return {"message": "爬虫任务已停止"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
