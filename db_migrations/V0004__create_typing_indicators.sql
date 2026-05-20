CREATE TABLE IF NOT EXISTS typing_indicators (
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);