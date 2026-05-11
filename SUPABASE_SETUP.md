# Supabase 数据库配置指南

本项目已集成 Supabase 数据库，可以将数据存储到云端，实现跨设备同步。

## 1. 注册 Supabase 账号

1. 访问 [Supabase 官网](https://supabase.com/)
2. 点击右上角"Start your project"
3. 使用 GitHub 账号登录（推荐）或邮箱注册
4. 完成注册并登录

## 2. 创建新项目

1. 登录后，点击"New Project"
2. 选择组织（或创建新组织）
3. 填写项目信息：
   - **Name**: `xia-website`（或其他名称）
   - **Database Password**: 设置一个强密码（请保存好）
   - **Region**: 选择离你最近的区域
     - 国内用户推荐：Singapore (Southeast Asia)
     - 国际用户：Northeast Asia (Tokyo) 或其他
4. 点击"Create new project"（等待几分钟创建完成）

## 3. 获取 API 凭据

项目创建完成后：

1. 在左侧菜单点击 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon public**: 一个很长的密钥

## 4. 配置项目

在项目根目录创建 `.env.local` 文件：

```bash
# 复制示例文件
cp .env.example .env.local
```

编辑 `.env.local`，填入你的凭据：

```env
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon密钥
```

## 5. 创建数据表

在 Supabase 控制台：

1. 点击左侧 **Table Editor** → **Create a new table**
2. 创建 `posts` 表：

### posts 表（文章）
字段 | 类型 | 默认值 | 说明
-----|------|--------|------
id | int8 | - | 主键（自动生成）
title | text | - | 文章标题
excerpt | text | - | 文章摘要
content | text | - | 文章内容
category | text | - | 分类名称
category_id | text | - | 分类ID
date | text | - | 发布日期
read_time | text | - | 阅读时长
views | int8 | 0 | 浏览次数
tags | text[] | {} | 标签数组
created_at | timestamptz | now() | 创建时间
updated_at | timestamptz | now() | 更新时间

3. 创建 `gallery_items` 表：

### gallery_items 表（画廊）
字段 | 类型 | 默认值 | 说明
-----|------|--------|------
id | int8 | - | 主键（自动生成）
title | text | - | 作品标题
description | text | - | 作品描述
category | text | - | 分类名称
category_id | text | - | 分类ID
date | text | - | 创建日期
type | text | icon | 类型（icon/image）
icon | text | - | emoji图标
image | text | - | 图片URL（Base64）
gradient | text | - | 渐变色
created_at | timestamptz | now() | 创建时间
updated_at | timestamptz | now() | 更新时间

## 6. 配置 RLS（行级安全）

默认情况下，Supabase 启用了 RLS，需要配置策略允许访问：

1. 在 **Table Editor** 中选择 `posts` 表
2. 点击 **RLS policies** → **Enable RLS**
3. 添加策略：
   - **Name**: Allow public access
   - **Allowed operation**: ALL
   - **Target role**: anon
   - ** USING expression**: `true`

对 `gallery_items` 表重复相同步骤。

## 7. 切换存储模式

在 `src/utils/storage.js` 中修改存储模式：

```javascript
// 使用 Supabase 云端存储
const STORAGE_MODE = 'supabase'

// 或使用浏览器本地存储（默认）
const STORAGE_MODE = 'local'
```

## 8. 测试连接

启动开发服务器：

```bash
npm run dev
```

打开浏览器控制台，如果看到 "Supabase 初始化成功" 表示连接成功。

## 常见问题

### Q: 数据存储失败？
A: 检查以下内容：
1. `.env.local` 文件配置是否正确
2. Supabase 项目是否创建了对应的数据表
3. RLS 策略是否正确配置
4. API 密钥是否正确

### Q: 如何切换回本地存储？
A: 在 `src/utils/storage.js` 中将 `STORAGE_MODE` 改为 `'local'`

### Q: 免费版有什么限制？
A: Supabase 免费版：
- 500MB 数据库存储
- 1GB 文件存储
- 50MB 带宽/月
- 2个并发请求
- 适合个人网站和小项目

### Q: 数据可以导出吗？
A: 可以！在 Supabase 控制台：
1. 数据库 → 数据导出
2. 或使用 SQL 查询后导出 CSV

## 数据迁移

### 从 localStorage 迁移到 Supabase

1. 配置好 Supabase
2. 访问网站，系统会自动初始化示例数据
3. 手动添加之前的内容

### 从 Supabase 迁移到 localStorage

修改 `STORAGE_MODE = 'local'`，数据会保存在浏览器中。

## 优势

✅ **完全免费**：慷慨的免费额度
✅ **开源**：基于 PostgreSQL，可随时导出
✅ **实时功能**：支持实时订阅
✅ **易于使用**：友好的 Web 界面
✅ **全球 CDN**：快速访问
