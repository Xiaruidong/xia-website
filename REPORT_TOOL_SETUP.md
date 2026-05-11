# 研报工具数据库配置

## 数据表结构

### reports 表（研报主表）

```sql
CREATE TABLE reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- monthly, weekly, daily, special
  category TEXT NOT NULL, -- 原油, 黄金, 铜, 股指, 国债, 其他
  report_date DATE NOT NULL,
  institution TEXT, -- 研究机构
  file_name TEXT,
  file_url TEXT, -- PDF 文件存储路径
  page_count INTEGER,
  text_length INTEGER,
  sections_count INTEGER DEFAULT 0,
  tables_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_date ON reports(report_date DESC);
```

### report_sections 表（研报板块）

```sql
CREATE TABLE report_sections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  content TEXT,
  section_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sections_report ON report_sections(report_id);
CREATE INDEX idx_sections_name ON report_sections(section_name);
```

### report_tables 表（研报表格）

```sql
CREATE TABLE report_tables (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  table_name TEXT,
  table_order INTEGER DEFAULT 0,
  headers JSONB, -- 表头数组
  data JSONB, -- 表格数据（二维数组）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tables_report ON report_tables(report_id);
```

## Supabase 配置步骤

### 1. 创建数据表

在 Supabase 控制台 → SQL Editor 中执行上述 SQL 语句。

### 2. 配置 RLS 策略

```sql
-- 启用 RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_tables ENABLE ROW LEVEL SECURITY;

-- 允许所有读取
CREATE POLICY "Allow public read on reports"
  ON reports FOR SELECT USING (true);

CREATE POLICY "Allow public read on sections"
  ON report_sections FOR SELECT USING (true);

CREATE POLICY "Allow public read on tables"
  ON report_tables FOR SELECT USING (true);

-- 允许所有插入（如果需要公开上传）
CREATE POLICY "Allow public insert on reports"
  ON reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on sections"
  ON report_sections FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on tables"
  ON report_tables FOR INSERT WITH CHECK (true);
```

### 3. 启用文件存储（可选）

如果需要存储 PDF 文件：

1. 在 Supabase 控制台 → Storage → Create a new bucket
2. Bucket 名称: `reports`
3. Public bucket: 是（如果需要公开访问）
4. 配置 CORS 策略允许上传

## API 使用示例

```javascript
import { getSupabase } from '@/utils/supabase'

const supabase = getSupabase()

// 保存研报
const { data: report } = await supabase
  .from('reports')
  .insert({
    title: '【原油月报20260508】：等待空配',
    report_type: 'monthly',
    category: '原油',
    report_date: '2026-05-08',
    institution: '五矿期货',
    page_count: 10,
    sections_count: 5,
    tables_count: 3
  })
  .select()
  .single()

// 保存板块
await Promise.all(
  sections.map(section =>
    supabase.from('report_sections').insert({
      report_id: report.id,
      section_name: section.title,
      content: section.content
    })
  )
)

// 查询研报列表
const { data: reports } = await supabase
  .from('reports')
  .select('*')
  .eq('category', '原油')
  .order('report_date', { ascending: false })

// 查询研报详情（包含板块和表格）
const { data: report } = await supabase
  .from('reports')
  .select(`
    *,
    report_sections (*),
    report_tables (*)
  `)
  .eq('id', reportId)
  .single()
```
