# Leancloud 数据库配置指南

本项目已集成 Leancloud 数据库，可以将数据存储到云端，实现跨设备同步。

## 1. 注册 Leancloud 账号

1. 访问 [Leancloud 官网](https://leancloud.cn/)
2. 点击右上角"免费注册"
3. 完成注册并登录

## 2. 创建应用

1. 登录后，点击"创建应用"
2. 选择"开发版"（免费）
3. 填写应用名称，例如：`xia-website`
4. 选择应用分类：`Web`
5. 点击"创建"

## 3. 获取应用凭据

创建完成后，在应用设置中获取：

1. 进入应用 → 设置 → 应用凭证
2. 找到以下信息：
   - `App ID`
   - `App Key`
   - `REST API 服务器地址`（国内版需要）

## 4. 配置项目

在项目根目录创建 `.env.local` 文件：

```bash
# 复制示例文件
cp .env.example .env.local
```

编辑 `.env.local`，填入你的凭据：

```env
VITE_LEANCLOUD_APP_ID=你的AppID
VITE_LEANCLOUD_APP_KEY=你的AppKey
VITE_LEANCLOUD_SERVER_URL=https://你的AppID.leancloud.cn
```

## 5. 配置数据表

在 Leancloud 控制台，创建以下数据表（Class）：

### Post 表（文章）
字段 | 类型 | 必填 | 说明
-----|------|------|------
title | String | 是 | 文章标题
excerpt | String | 是 | 文章摘要
content | String | 是 | 文章内容（HTML）
category | String | 是 | 分类名称
categoryId | String | 是 | 分类ID
date | String | 是 | 发布日期
readTime | String | 是 | 阅读时长
views | Number | 否 | 浏览次数
tags | Array | 否 | 标签数组
color | String | 否 | 分类颜色

### GalleryItem 表（画廊）
字段 | 类型 | 必填 | 说明
-----|------|------|------
title | String | 是 | 作品标题
description | String | 否 | 作品描述
category | String | 是 | 分类名称
categoryId | String | 是 | 分类ID
date | String | 是 | 创建日期
type | String | 是 | 类型（icon/image）
icon | String | 否 | emoji图标
image | String | 否 | 图片URL（Base64）
gradient | String | 否 | 渐变色

## 6. 设置安全域名

在 Leancloud 控制台：
1. 设置 → 安全中心
2. 添加你的网站域名到"Web 应用安全域名"
   - 本地开发：`http://localhost:5173`
   - 生产环境：`https://xiaruidong.github.io`

## 7. 切换存储模式

在 `src/utils/storage.js` 中修改存储模式：

```javascript
// 使用 Leancloud 云端存储
const STORAGE_MODE = 'leancloud'

// 或使用浏览器本地存储（默认）
const STORAGE_MODE = 'local'
```

## 8. 测试连接

启动开发服务器：

```bash
npm run dev
```

打开浏览器控制台，如果看到 "Leancloud 初始化成功" 表示连接成功。

## 常见问题

### Q: 数据存储失败？
A: 检查以下内容：
1. `.env.local` 文件配置是否正确
2. Leancloud 应用是否创建了对应的数据表
3. 安全域名是否配置正确

### Q: 如何切换回本地存储？
A: 在 `src/utils/storage.js` 中将 `STORAGE_MODE` 改为 `'local'`

### Q: 免费版有什么限制？
A: 开发版免费额度：
- 500MB 数据库存储
- 5万次/月 API 请求
- 适合个人网站和小项目

## 数据迁移

### 从 localStorage 迁移到 Leancloud

1. 配置好 Leancloud
2. 访问网站，系统会自动初始化示例数据
3. 手动添加之前的内容

### 从 Leancloud 迁移到 localStorage

修改 `STORAGE_MODE = 'local'`，数据会保存在浏览器中。
