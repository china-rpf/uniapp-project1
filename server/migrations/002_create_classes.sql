CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id),
  invite_code VARCHAR(8) UNIQUE NOT NULL,
  min_members INTEGER DEFAULT 15,
  max_members INTEGER DEFAULT 50,
  current_members INTEGER DEFAULT 0,
  grade_tag VARCHAR(20),
  status VARCHAR(20) DEFAULT 'assembling',
  assemble_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classes_invite_code ON classes(invite_code);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_classes_creator ON classes(creator_id);
