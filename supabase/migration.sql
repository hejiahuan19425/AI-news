-- AI 观察 — 数据库迁移
-- 在 Supabase SQL Editor 中执行此文件

-- 信源表
CREATE TABLE sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rss', 'scrape', 'twitter')),
  url TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 文章表
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES sources(id),
  title_original TEXT,
  title_zh TEXT NOT NULL,
  summary_zh TEXT NOT NULL,
  detail_what TEXT,
  detail_why TEXT,
  detail_background TEXT,
  tags TEXT[] DEFAULT '{}',
  original_url TEXT UNIQUE NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  hidden BOOLEAN DEFAULT false
);

-- 索引
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_source_id ON articles(source_id);
CREATE INDEX idx_articles_hidden ON articles(hidden);
