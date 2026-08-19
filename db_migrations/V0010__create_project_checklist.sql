CREATE TABLE IF NOT EXISTS project_checklist (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    item_key VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'none',
    note TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_checklist_project ON project_checklist(project_id);
