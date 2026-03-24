CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wx_openid VARCHAR(128) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  avatar TEXT,
  gender SMALLINT DEFAULT 0,
  birth_year INTEGER,
  grade VARCHAR(20),
  bio TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_wx_openid ON users(wx_openid);
CREATE INDEX idx_users_status ON users(status);
