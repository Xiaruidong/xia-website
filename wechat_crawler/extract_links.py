"""
从微信文章链接列表中提取投递链接
适用于手动获取文章链接后的批量处理
"""

import requests
import re
import csv
from datetime import datetime
from typing import List, Dict
import time


def extract_application_links(content: str) -> List[Dict]:
    """从文章内容中提取投递链接"""
    application_links = []

    # 匹配各种招聘/投递相关链接
    patterns = [
        # 常见招聘平台
        r'https?://[a-zA-Z0-9\-\.]*(nowcoder|liepin|zhipin|bosszhipin|lagou|51job|zhaopin)\.[a-zA-Z]{2,3}/[^\s<>"]+',
        # 投递表单
        r'https?://[a-zA-Z0-9\-\.]*wj\.cn/[^\s<>"]+',
        r'https?://[a-zA-Z0-9\-\.]*wenjuan\.com/[^\s<>"]+',
        r'https?://docs\.qq\.com/form/[^\s<>"]+',
        r'https?://www\.wjx\.cn/[^\s<>"]+',
        # 阿里、腾讯等大厂招聘
        r'https?://jobs\.zhaopin\.com/[^\s<>"]+',
        r'https?://campus\.alibaba\.com/[^\s<>"]+',
        r'https?://careers\.tencent\.com/[^\s<>"]+',
        # 通用HTTP链接
        r'https?://[^\s<>"]+',
    ]

    seen_urls = set()

    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            # 清理URL
            clean_url = match.split('"')[0].split("'")[0].split('<')[0].split(')')[0]

            # 去重
            if clean_url not in seen_urls and len(clean_url) > 20:
                seen_urls.add(clean_url)
                application_links.append({
                    'url': clean_url,
                    'type': classify_link(clean_url)
                })

    return application_links


def classify_link(url: str) -> str:
    """识别链接类型"""
    url_lower = url.lower()

    platform_keywords = {
        'nowcoder': '牛客网',
        'liepin': '猎聘',
        'zhipin': 'BOSS直聘',
        'boss': 'BOSS直聘',
        'lagou': '拉勾',
        '51job': '前程无忧',
        'zhaopin': '前程无忧',
        'wj.cn': '问卷表单',
        'wenjuan': '问卷表单',
        'wjx.cn': '问卷星',
        'docs.qq.com': '腾讯文档表单',
        'alibaba': '阿里巴巴招聘',
        'tencent': '腾讯招聘',
        'bytedance': '字节跳动招聘',
        'baidu': '百度招聘',
        'meituan': '美团招聘',
    }

    for keyword, platform in platform_keywords.items():
        if keyword in url_lower:
            return platform

    # 根据URL特征判断
    if 'apply' in url_lower or 'job' in url_lower or 'career' in url_lower or 'campus' in url_lower:
        return '招聘官网'

    return '其他链接'


def get_article_content(url: str) -> str:
    """获取文章内容"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.encoding = 'utf-8'
        return response.text
    except Exception as e:
        print(f"获取文章失败: {url}, 错误: {str(e)}")
        return ""


def load_article_links(filename: str) -> List[str]:
    """从文件加载文章链接"""
    links = []

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    links.append(line)

        print(f"加载了 {len(links)} 个文章链接")
        return links

    except FileNotFoundError:
        print(f"文件不存在: {filename}")
        print("\n请创建 article_links.txt 文件，每行一个文章链接")
        return []


def process_articles(article_urls: List[str]) -> List[Dict]:
    """处理文章列表并提取投递链接"""
    results = []

    for i, url in enumerate(article_urls, 1):
        print(f"\n[{i}/{len(article_urls)}] 处理文章...")

        content = get_article_content(url)

        if content:
            # 提取标题
            title_match = re.search(r'<meta property="og:title" content="([^"]+)"', content)
            title = title_match.group(1) if title_match else f"文章{i}"

            print(f"  标题: {title}")

            # 提取链接
            links = extract_application_links(content)

            if links:
                print(f"  ✓ 找到 {len(links)} 个链接:")
                for link in links[:5]:  # 只显示前5个
                    print(f"    - [{link['type']}] {link['url'][:80]}...")
                if len(links) > 5:
                    print(f"    ... 还有 {len(links) - 5} 个链接")

                results.append({
                    'title': title,
                    'url': url,
                    'links': links
                })
            else:
                print(f"  ✗ 未找到投递链接")

        # 避免请求过快
        time.sleep(1)

    return results


def save_results(results: List[Dict], account_name: str = "result"):
    """保存结果到CSV"""
    if not results:
        print("\n没有找到任何投递链接")
        return

    filename = f"{account_name}_投递链接_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['文章标题', '文章链接', '投递链接', '链接类型', '提取时间'])

        for article in results:
            for link in article['links']:
                writer.writerow([
                    article['title'],
                    article['url'],
                    link['url'],
                    link['type'],
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                ])

    print(f"\n✓ 结果已保存到: {filename}")

    # 统计
    total_links = sum(len(a['links']) for a in results)
    print(f"✓ 共处理 {len(results)} 篇文章")
    print(f"✓ 共提取 {total_links} 个投递链接")


def main():
    """主函数"""
    print("=" * 60)
    print("微信文章投递链接提取工具")
    print("=" * 60)

    # 加载文章链接
    article_urls = load_article_links('article_links.txt')

    if not article_urls:
        print("\n请按以下格式创建 article_links.txt 文件:")
        print("-" * 40)
        print("# 国资小新文章链接")
        print("https://mp.weixin.qq.com/s/xxxxxxxx")
        print("https://mp.weixin.qq.com/s/yyyyyyyy")
        print("")
        print("# 神仙外企文章链接")
        print("https://mp.weixin.qq.com/s/zzzzzzzz")
        return

    # 处理文章
    results = process_articles(article_urls)

    # 保存结果
    save_results(results)


if __name__ == '__main__':
    main()
