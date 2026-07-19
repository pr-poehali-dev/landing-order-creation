INSERT INTO site_sections (key, title, enabled) VALUES
    ('portfolio', 'Портфолио работ', TRUE)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS portfolio (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    color VARCHAR(16) NOT NULL DEFAULT '#a855f7',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO portfolio (title, category, image_url, color, sort_order) VALUES
    ('Автосервис', 'Авто', 'https://cdn.poehali.dev/projects/11278de9-bb64-4412-99d5-6610112c9f28/files/6e9491da-8931-4aab-a44e-dd86f7a0f84f.jpg', '#a855f7', 1),
    ('Автомойка', 'Авто', 'https://cdn.poehali.dev/projects/11278de9-bb64-4412-99d5-6610112c9f28/files/06e9aeb6-62f6-4771-ac96-80e5f724169d.jpg', '#00f5ff', 2),
    ('Ресторан & Кафе', 'HoReCa', 'https://cdn.poehali.dev/projects/11278de9-bb64-4412-99d5-6610112c9f28/files/6dc6fe87-8aa7-4754-944b-9c92d29d4c63.jpg', '#f72585', 3),
    ('Языковая студия', 'Образование', 'https://cdn.poehali.dev/projects/11278de9-bb64-4412-99d5-6610112c9f28/files/d449a997-9a87-46a4-a01c-889cfb4145de.jpg', '#facc15', 4),
    ('Бьюти-Мастер', 'Красота', 'https://cdn.poehali.dev/projects/11278de9-bb64-4412-99d5-6610112c9f28/files/738e755f-3a45-4147-b48d-6ff7a6961f36.jpg', '#fb7185', 5),
    ('Барбер Шоп', 'Барбершоп', 'https://cdn.poehali.dev/projects/11278de9-bb64-4412-99d5-6610112c9f28/files/ca4cde6f-570e-4c04-9693-f6b70c9bfc80.jpg', '#d97706', 6);
