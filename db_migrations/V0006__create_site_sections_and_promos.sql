CREATE TABLE IF NOT EXISTS site_sections (
    key VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO site_sections (key, title, enabled) VALUES
    ('promo', 'Акции и спецпредложения', FALSE)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS promos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    badge VARCHAR(64) NOT NULL DEFAULT '',
    old_price VARCHAR(64) NOT NULL DEFAULT '',
    new_price VARCHAR(64) NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
