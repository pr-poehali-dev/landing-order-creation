INSERT INTO site_sections (key, title, enabled) VALUES
    ('blog', 'Блог / Статьи', TRUE)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    cover_url TEXT NOT NULL DEFAULT '',
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

INSERT INTO articles (slug, title, excerpt, content, cover_url, published) VALUES
(
  'kak-lending-privlekaet-klientov',
  'Как лендинг привлекает клиентов',
  'Разбираем, почему одностраничный сайт часто продаёт лучше большого корпоративного портала и на что обратить внимание при создании.',
  'Лендинг — это одностраничный сайт, заточенный под одно целевое действие: заявку, звонок или покупку.

Почему он работает:
— Концентрирует внимание на одном предложении, без отвлекающих разделов.
— Ведёт клиента по логичному пути: проблема → решение → выгоды → доверие → действие.
— Легко тестируется и оптимизируется под рекламу.

Чтобы лендинг приносил заявки, важны понятный оффер в первом экране, честные отзывы, наглядное портфолио и простая форма заявки. Всё это мы закладываем в каждый проект.',
  '',
  TRUE
);
