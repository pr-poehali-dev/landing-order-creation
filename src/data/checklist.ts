export type ChecklistItem = {
  key: string;
  title: string;
  hint: string;
  type: "yesno" | "text";
  upload?: string;
};

export type ChecklistGroup = {
  title: string;
  icon: string;
  items: ChecklistItem[];
};

export const CHECKLIST: ChecklistGroup[] = [
  {
    title: "О бизнесе",
    icon: "Briefcase",
    items: [
      { key: "business_field", title: "Сфера деятельности", hint: "Чем занимается компания, что продаёте", type: "text" },
      { key: "company_name", title: "Название компании / бренда", hint: "Как называется бизнес", type: "text" },
      { key: "target_audience", title: "Кто ваши клиенты", hint: "Возраст, город, чем занимаются, что для них важно", type: "text" },
      { key: "services_prices", title: "Услуги и цены", hint: "Список услуг или товаров с ценами", type: "text", upload: "Если есть готовый прайс-лист — загрузите файл" },
      { key: "advantages", title: "Ваши преимущества", hint: "Почему клиенты должны выбрать именно вас", type: "text" },
      { key: "competitors", title: "Конкуренты / примеры сайтов", hint: "Ссылки на сайты, которые нравятся или не нравятся", type: "text" },
    ],
  },
  {
    title: "Контакты и реквизиты",
    icon: "Phone",
    items: [
      { key: "contacts", title: "Телефон и почта", hint: "Контакты для связи, которые разместим на сайте", type: "text" },
      { key: "address", title: "Адрес", hint: "Адрес офиса или точки, нужна ли карта проезда", type: "text" },
      { key: "socials", title: "Соцсети и мессенджеры", hint: "Telegram, WhatsApp, VK, Instagram и др.", type: "text" },
      { key: "work_hours", title: "Режим работы", hint: "Часы приёма клиентов, выходные", type: "text" },
      { key: "legal_info", title: "Реквизиты для документов", hint: "ИП/ООО, ИНН — для политики конфиденциальности", type: "text" },
    ],
  },
  {
    title: "Домен и хостинг",
    icon: "Globe",
    items: [
      { key: "domain", title: "Домен куплен?", hint: "Если да — укажите адрес. Если нет — поможем подобрать и купить", type: "yesno" },
      { key: "hosting", title: "Хостинг есть?", hint: "Где будет размещён сайт. Если нет — предоставим свой", type: "yesno" },
      { key: "domain_access", title: "Доступы к домену переданы?", hint: "Логин/пароль от регистратора для подключения сайта", type: "yesno" },
      { key: "email_corporate", title: "Нужна корпоративная почта?", hint: "Почта вида info@вашдомен.ru", type: "yesno" },
    ],
  },
  {
    title: "Материалы и дизайн",
    icon: "Palette",
    items: [
      { key: "logo", title: "Логотип есть?", hint: "В хорошем качестве (PNG/SVG). Если нет — можем разработать", type: "yesno", upload: "Загрузите файл логотипа, если он у вас есть" },
      { key: "brandbook", title: "Фирменные цвета и шрифты?", hint: "Брендбук или пожелания по стилю", type: "yesno", upload: "Загрузите брендбук или гайдлайн, если есть" },
      { key: "design_ready", title: "Готовый дизайн страниц есть?", hint: "Макеты Figma/PSD. Если нет — разработаем с нуля", type: "yesno", upload: "Загрузите макеты или ссылку на Figma в поле ответа" },
      { key: "photos", title: "Фото и видео есть?", hint: "Фото работ, товаров, команды, помещения", type: "yesno", upload: "Загрузите фото — можно по одному, файлы попадут в проект" },
      { key: "texts", title: "Тексты готовы?", hint: "Описания услуг, о компании. Если нет — напишем сами", type: "yesno", upload: "Загрузите документ с текстами, если он готов" },
      { key: "reviews_materials", title: "Отзывы клиентов есть?", hint: "Скриншоты, тексты, видео отзывов", type: "yesno", upload: "Загрузите скриншоты или файл с отзывами" },
      { key: "style_wishes", title: "Пожелания по стилю", hint: "Строгий, яркий, минималистичный, какие цвета нравятся", type: "text" },
    ],
  },
  {
    title: "Функции сайта",
    icon: "Settings",
    items: [
      { key: "goal", title: "Главная цель сайта", hint: "Заявки, звонки, продажи, запись на услугу", type: "text" },
      { key: "form_email", title: "Куда отправлять заявки", hint: "Почта или Telegram для получения заявок с сайта", type: "text" },
      { key: "online_payment", title: "Нужна онлайн-оплата?", hint: "Приём платежей прямо на сайте", type: "yesno" },
      { key: "online_booking", title: "Нужна онлайн-запись?", hint: "Запись на услугу с выбором даты и времени", type: "yesno" },
      { key: "crm_integration", title: "Интеграция с CRM?", hint: "Битрикс24, amoCRM и другие системы", type: "yesno" },
      { key: "multilang", title: "Нужны языковые версии?", hint: "Сайт на нескольких языках", type: "yesno" },
    ],
  },
  {
    title: "Продвижение",
    icon: "TrendingUp",
    items: [
      { key: "analytics", title: "Подключить аналитику?", hint: "Яндекс.Метрика и Google Analytics", type: "yesno" },
      { key: "advertising", title: "Планируется реклама?", hint: "Яндекс.Директ, таргет — влияет на структуру лендинга", type: "yesno" },
      { key: "seo_keys", title: "Ключевые запросы для SEO", hint: "По каким словам должны находить ваш сайт", type: "text" },
      { key: "deadline", title: "Желаемые сроки запуска", hint: "К какой дате нужен готовый сайт", type: "text" },
    ],
  },
];

export const CHECKLIST_TOTAL = CHECKLIST.reduce((s, g) => s + g.items.length, 0);