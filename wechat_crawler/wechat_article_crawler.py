"""
微信公众号文章爬虫
用于获取公众号历史文章并提取投递链接
"""

import requests
import re
import json
import time
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse
import csv
from datetime import datetime


class WeChatArticleCrawler:
    """微信公众号文章爬虫"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        })

    def search_sogou_wechat(self, account_name: str, max_pages: int = 5) -> List[Dict]:
        """
        通过搜狗微信搜索获取公众号文章

        Args:
            account_name: 公众号名称
            max_pages: 最大搜索页数

        Returns:
            文章列表
        """
        articles = []
        base_url = "https://weixin.sogou.com/weixin"

        for page in range(max_pages):
            params = {
                'type': 2,  # 1=搜索公众号, 2=搜索文章
                'query': account_name,
                'ie': 'utf8',
                'page': page + 1,
            }

            try:
                response = self.session.get(base_url, params=params, timeout=10)
                response.encoding = 'utf-8'

                # 解析文章列表
                page_articles = self._parse_sogou_results(response.text)
                articles.extend(page_articles)

                print(f"第{page + 1}页: 找到 {len(page_articles)} 篇文章")

                if len(page_articles) == 0:
                    break

                time.sleep(2)  # 避免请求过快

            except Exception as e:
                print(f"搜索第{page + 1}页时出错: {str(e)}")
                break

        return articles

    def _parse_sogou_results(self, html: str) -> List[Dict]:
        """解析搜狗搜索结果"""
        articles = []

        # 正则匹配文章链接
        link_pattern = r'<a target="_blank" href="([^"]*mp\.weixin\.qq\.com[^"]*)"[^>]*>(.*?)</a>'
        matches = re.findall(link_pattern, html, re.DOTALL)

        for url, title_html in matches:
            # 提取真实URL（需要解密）
            if 'url=' in url:
                real_url = self._extract_sogou_url(url)
            else:
                real_url = url

            # 清理标题
            title_match = re.search(r'>(.*?)<', title_html)
            title = title_match.group(1).strip() if title_match else "未知标题"

            # 去除HTML标签
            title = re.sub(r'<[^>]+>', '', title)

            articles.append({
                'title': title,
                'url': real_url,
                'source': 'sogou'
            })

        return articles

    def _extract_sogou_url(self, sogou_url: str) -> str:
        """从搜狗链接中提取微信文章真实链接"""
        try:
            # 访问搜狗链接，跳转到微信文章
            response = self.session.get(sogou_url, timeout=10, allow_redirects=True)
            return response.url
        except:
            return sogou_url

    def get_article_content(self, article_url: str) -> Optional[str]:
        """
        获取文章内容

        Args:
            article_url: 文章链接

        Returns:
            文章HTML内容
        """
        try:
            response = self.session.get(article_url, timeout=15)
            response.encoding = 'utf-8'
            return response.text
        except Exception as e:
            print(f"获取文章内容失败: {str(e)}")
            return None

    def extract_application_links(self, content: str) -> List[Dict]:
        """
        从文章内容中提取投递链接

        Args:
            content: 文章HTML内容

        Returns:
            投递链接列表
        """
        application_links = []

        # 匹配各种招聘/投递相关链接
        patterns = [
            # 常见招聘平台
            r'https?://[a-zA-Z0-9\-\.]*(nowcoder|liepin|zhipin|bosszhipin|lagou|51job|zhaopin)\.[a-zA-Z]{2,3}/[^\s<>"]+',
            # 投递表单
            r'https?://[a-zA-Z0-9\-\.]*wj\.cn/[^\s<>"]+',
            r'https?://[a-zA-Z0-9\-\.]*wenjuan\.com/[^\s<>"]+',
            r'https?://docs\.qq\.com/form/[^\s<>"]+',
            # 通用HTTP链接（包含招聘关键词）
            r'https?://[^\s<>"]+?(?:投递|申请|简历|招聘|apply|job|career)[^\s<>"]*',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                # 清理URL
                clean_url = match.split('"')[0].split("'")[0].split('<')[0]

                # 去重
                if not any(link['url'] == clean_url for link in application_links):
                    application_links.append({
                        'url': clean_url,
                        'type': self._classify_link(clean_url)
                    })

        return application_links

    def _classify_link(self, url: str) -> str:
        """识别链接类型"""
        url_lower = url.lower()

        if 'nowcoder' in url_lower:
            return '牛客网'
        elif 'liepin' in url_lower:
            return '猎聘'
        elif 'zhipin' in url_lower or 'boss' in url_lower:
            return 'BOSS直聘'
        elif 'lagou' in url_lower:
            return '拉勾'
        elif '51job' in url_lower or 'zhaopin' in url_lower:
            return '前程无忧'
        elif 'wj.cn' in url_lower or 'wenjuan' in url_lower:
            return '问卷表单'
        elif 'docs.qq.com' in url_lower:
            return '腾讯文档表单'
        else:
            return '其他链接'

    def crawl_account_articles(self, account_name: str, max_articles: int = 50) -> List[Dict]:
        """
        爬取公众号文章并提取投递链接

        Args:
            account_name: 公众号名称
            max_articles: 最大文章数量

        Returns:
            包含投递链接的文章列表
        """
        print(f"\n开始爬取公众号: {account_name}")
        print("=" * 50)

        # 搜索文章
        articles = self.search_sogou_wechat(account_name, max_pages=10)
        articles = articles[:max_articles]

        results = []

        for i, article in enumerate(articles, 1):
            print(f"\n[{i}/{len(articles)}] 处理: {article['title']}")

            # 获取文章内容
            content = self.get_article_content(article['url'])

            if content:
                # 提取投递链接
                app_links = self.extract_application_links(content)

                if app_links:
                    print(f"  ✓ 找到 {len(app_links)} 个投递链接")
                    for link in app_links:
                        print(f"    - [{link['type']}] {link['url']}")

                    results.append({
                        'title': article['title'],
                        'url': article['url'],
                        'application_links': app_links,
                        'link_count': len(app_links)
                    })
                else:
                    print(f"  ✗ 未找到投递链接")

            # 避免请求过快
            time.sleep(1)

        return results

    def save_to_csv(self, results: List[Dict], account_name: str):
        """保存结果到CSV文件"""
        filename = f"{account_name}_投递链接_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)
            writer.writerow(['文章标题', '文章链接', '投递链接', '链接类型', '提取时间'])

            for article in results:
                for link in article['application_links']:
                    writer.writerow([
                        article['title'],
                        article['url'],
                        link['url'],
                        link['type'],
                        datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    ])

        print(f"\n结果已保存到: {filename}")


def main():
    """主函数"""
    crawler = WeChatArticleCrawler()

    # 要爬取的公众号列表
    accounts = [
        '国资小新',
        '神仙外企'
    ]

    all_results = {}

    for account in accounts:
        results = crawler.crawl_account_articles(account, max_articles=30)
        all_results[account] = results

        # 保存结果
        if results:
            crawler.save_to_csv(results, account)

    # 汇总统计
    print("\n" + "=" * 50)
    print("爬取完成！汇总统计:")
    for account, results in all_results.items():
        total_links = sum(article['link_count'] for article in results)
        print(f"{account}: {len(results)} 篇文章, {total_links} 个投递链接")


if __name__ == '__main__':
    main()
