INSERT INTO site_sections (key, title, enabled) VALUES
    ('reviews', 'Отзывы клиентов', TRUE)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL DEFAULT '',
    text TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 5,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO reviews (name, role, text, rating, sort_order) VALUES
    ('Алексей Кузнецов', 'Владелец фитнес-клуба', 'Заказал лендинг для своего клуба — результат превзошёл все ожидания. За первую неделю после запуска пришло 23 заявки. Отличная команда!', 5, 1),
    ('Мария Соколова', 'Директор Beauty Studio', 'Долго выбирала подрядчика. Здесь всё чётко: договор, сроки, результат. Дизайн получился именно такой, о котором мечтала. Рекомендую!', 5, 2),
    ('Дмитрий Орлов', 'CEO, IT-компания', 'Профессиональный подход, современный дизайн и полное погружение в наш продукт. Конверсия выросла в 2.5 раза после запуска нового лендинга.', 5, 3);
