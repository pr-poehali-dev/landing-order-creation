import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const PORTFOLIO = [
  {
    title: "Интернет-магазин",
    category: "E-commerce",
    img: "https://cdn.poehali.dev/projects/11278de9-bb64-4412-99d5-6610112c9f28/files/b4b94438-737c-4a53-a2c7-4c99bc29b82a.jpg",
    color: "#a855f7",
  },
  {
    title: "SaaS платформа",
    category: "Технологии",
    img: "https://cdn.poehali.dev/projects/11278de9-bb64-4412-99d5-6610112c9f28/files/e2583474-8c28-4984-b1df-7c57f7ef3e88.jpg",
    color: "#00f5ff",
  },
  {
    title: "Ресторан & Кафе",
    category: "HoReCa",
    img: "https://cdn.poehali.dev/projects/11278de9-bb64-4412-99d5-6610112c9f28/files/6dc6fe87-8aa7-4754-944b-9c92d29d4c63.jpg",
    color: "#f72585",
  },
];

const ADVANTAGES = [
  { icon: "Zap", title: "Быстрая разработка", desc: "Готовый лендинг от 5 дней. Без долгих согласований и бесконечных правок.", color: "#a855f7" },
  { icon: "TrendingUp", title: "Конверсия в заявки", desc: "Проектируем путь клиента так, чтобы он хотел позвонить или оставить заявку.", color: "#00f5ff" },
  { icon: "Palette", title: "Уникальный дизайн", desc: "Никаких шаблонов. Каждый проект — отдельная дизайн-концепция под ваш бренд.", color: "#f72585" },
  { icon: "Shield", title: "Гарантия результата", desc: "Фиксированная цена в договоре. Правки включены. Работаем до принятия.", color: "#4ade80" },
  { icon: "Smartphone", title: "Мобильная адаптация", desc: "Сайт идеально выглядит на любом устройстве — телефоне, планшете, ноутбуке.", color: "#fb923c" },
  { icon: "BarChart3", title: "Аналитика и SEO", desc: "Подключаем метрику, Яндекс и Google аналитику. Настраиваем базовое SEO.", color: "#facc15" },
];

const PROCESS = [
  { num: "01", title: "Заявка и бриф", desc: "Вы оставляете заявку. Мы связываемся и задаём вопросы о вашем бизнесе и целях сайта." },
  { num: "02", title: "Дизайн-концепция", desc: "Разрабатываем уникальный визуал: цвета, шрифты, структуру страницы. Показываем и согласовываем." },
  { num: "03", title: "Разработка", desc: "Верстаем и программируем. Подключаем формы, аналитику и всё, что нужно для работы сайта." },
  { num: "04", title: "Запуск и поддержка", desc: "Публикуем сайт, настраиваем домен. Первые 30 дней — бесплатные правки и поддержка." },
];

const REVIEWS = [
  {
    name: "Алексей Кузнецов",
    role: "Владелец фитнес-клуба",
    text: "Заказал лендинг для своего клуба — результат превзошёл все ожидания. За первую неделю после запуска пришло 23 заявки. Отличная команда!",
    rating: 5,
    avatar: "АК",
  },
  {
    name: "Мария Соколова",
    role: "Директор Beauty Studio",
    text: "Долго выбирала подрядчика. Здесь всё чётко: договор, сроки, результат. Дизайн получился именно такой, о котором мечтала. Рекомендую!",
    rating: 5,
    avatar: "МС",
  },
  {
    name: "Дмитрий Орлов",
    role: "CEO, IT-компания",
    text: "Профессиональный подход, современный дизайн и полное погружение в наш продукт. Конверсия выросла в 2.5 раза после запуска нового лендинга.",
    rating: 5,
    avatar: "ДО",
  },
];

function PrivacyModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl p-8 animate-fade-in"
        style={{
          background: "rgba(18,18,28,0.98)",
          border: "1px solid rgba(168,85,247,0.2)",
          boxShadow: "0 0 60px rgba(168,85,247,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <Icon name="X" size={16} className="text-white/60" />
        </button>

        <h2 className="font-oswald font-black text-3xl mb-6 gradient-text">Политика в отношении обработки персональных данных</h2>

        <div className="space-y-5 text-white/60 text-sm leading-relaxed">

          <section>
            <h3 className="font-semibold text-white mb-2">1. Общие положения</h3>
            <p>Настоящая политика обработки персональных данных составлена в соответствии с требованиями Федерального закона от 27.07.2006. № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению безопасности персональных данных LandingGuru.ru (далее — Оператор).</p>
            <p className="mt-2">1.1 Оператор ставит своей важнейшей целью и условием осуществления своей деятельности соблюдение прав и свобод человека и гражданина при обработке его персональных данных, в том числе защиты прав на неприкосновенность частной жизни, личную и семейную тайну.</p>
            <p className="mt-2">1.2 Настоящая политика Оператора в отношении обработки персональных данных (далее — Политика) применяется ко всей информации, которую Оператор может получить о посетителях веб-сайта https://landingguru.ru/.</p>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">2. Основные понятия, используемые в Политике</h3>
            <p>2.1 Автоматизированная обработка персональных данных — обработка персональных данных с помощью средств вычислительной техники.</p>
            <p className="mt-2">2.2 Блокирование персональных данных — временное прекращение обработки персональных данных (за исключением случаев, если обработка необходима для уточнения персональных данных).</p>
            <p className="mt-2">2.3 Веб-сайт — совокупность графических и информационных материалов, а также программ для ЭВМ и баз данных, обеспечивающих их доступность в сети интернет по сетевому адресу https://landingguru.ru/.</p>
            <p className="mt-2">2.4 Информационная система персональных данных — совокупность содержащихся в базах данных персональных данных, и обеспечивающих их обработку информационных технологий и технических средств.</p>
            <p className="mt-2">2.5 Обезличивание персональных данных — действия, в результате которых невозможно определить без использования дополнительной информации принадлежность персональных данных конкретному Пользователю или иному субъекту персональных данных.</p>
            <p className="mt-2">2.6 Обработка персональных данных — любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу (распространение, предоставление, доступ), обезличивание, блокирование, удаление, уничтожение персональных данных.</p>
            <p className="mt-2">2.7 Оператор — государственный орган, муниципальный орган, юридическое или физическое лицо, самостоятельно или совместно с другими лицами организующие и (или) осуществляющие обработку персональных данных, а также определяющие цели обработки персональных данных, состав персональных данных, подлежащих обработке, действия (операции), совершаемые с персональными данными.</p>
            <p className="mt-2">2.8 Персональные данные — любая информация, относящаяся прямо или косвенно к определенному или определяемому Пользователю веб-сайта https://landingguru.ru/.</p>
            <p className="mt-2">2.9 Пользователь — любой посетитель веб-сайта https://landingguru.ru/.</p>
            <p className="mt-2">2.10 Предоставление персональных данных — действия, направленные на раскрытие персональных данных определенному лицу или определенному кругу лиц.</p>
            <p className="mt-2">2.11 Распространение персональных данных — любые действия, направленные на раскрытие персональных данных неопределенному кругу лиц (передача персональных данных) или на ознакомление с персональными данными неограниченного круга лиц, в том числе обнародование персональных данных в средствах массовой информации, размещение в информационно-телекоммуникационных сетях или предоставление доступа к персональным данным каким-либо иным способом.</p>
            <p className="mt-2">2.12 Трансграничная передача персональных данных — передача персональных данных на территорию иностранного государства органу власти иностранного государства, иностранному физическому или иностранному юридическому лицу.</p>
            <p className="mt-2">2.13 Уничтожение персональных данных — любые действия, в результате которых персональные данные уничтожаются безвозвратно с невозможностью дальнейшего восстановления содержания персональных данных в информационной системе персональных данных и (или) результате которых уничтожаются материальные носители персональных данных.</p>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">3. Оператор может обрабатывать следующие персональные данные Пользователя</h3>
            <p>3.1 Фамилия, имя, отчество.</p>
            <p className="mt-2">3.2 Электронный адрес.</p>
            <p className="mt-2">3.3 Номера телефонов.</p>
            <p className="mt-2">3.4 Также на сайте происходит сбор и обработка обезличенных данных о посетителях (в т.ч. файлов «cookie») с помощью сервисов интернет-статистики (Яндекс Метрика и Гугл Аналитика и других).</p>
            <p className="mt-2">3.5 Вышеперечисленные данные далее по тексту Политики объединены общим понятием Персональные данные.</p>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">4. Цели обработки персональных данных</h3>
            <p>4.1 Цель обработки персональных данных Пользователя — информирование Пользователя посредством отправки электронных писем.</p>
            <p className="mt-2">4.2 Также Оператор имеет право направлять Пользователю уведомления о новых продуктах и услугах, специальных предложениях и различных событиях. Пользователь всегда может отказаться от получения информационных сообщений, направив Оператору письмо на адрес электронной почты Оператора с пометкой «Отказ от уведомлениях о новых продуктах и услугах и специальных предложениях».</p>
            <p className="mt-2">4.3 Обезличенные данные Пользователей, собираемые с помощью сервисов интернет-статистики, служат для сбора информации о действиях Пользователей на сайте, улучшения качества сайта и его содержания.</p>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">5. Правовые основания обработки персональных данных</h3>
            <p>5.1 Оператор обрабатывает персональные данные Пользователя только в случае их заполнения и/или отправки Пользователем самостоятельно через специальные формы, расположенные на сайте https://landingguru.ru/. Заполняя соответствующие формы и/или отправляя свои персональные данные Оператору, Пользователь выражает свое согласие с данной Политикой.</p>
            <p className="mt-2">5.2 Оператор обрабатывает обезличенные данные о Пользователе в случае, если это разрешено в настройках браузера Пользователя (включено сохранение файлов «cookie» и использование технологии JavaScript).</p>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">6. Порядок сбора, хранения, передачи и других видов обработки персональных данных</h3>
            <p>Безопасность персональных данных, которые обрабатываются Оператором, обеспечивается путем реализации правовых, организационных и технических мер, необходимых для выполнения в полном объеме требований действующего законодательства в области защиты персональных данных.</p>
            <p className="mt-2">6.1 Оператор обеспечивает сохранность персональных данных и принимает все возможные меры, исключающие доступ к персональным данным неуполномоченных лиц.</p>
            <p className="mt-2">6.2 Персональные данные Пользователя никогда, ни при каких условиях не будут переданы третьим лицам, за исключением случаев, связанных с исполнением действующего законодательства.</p>
            <p className="mt-2">6.3 В случае выявления неточностей в персональных данных, Пользователь может актуализировать их самостоятельно, путем направления Оператору уведомление на адрес электронной почты Оператора с пометкой «Актуализация персональных данных».</p>
            <p className="mt-2">6.4 Срок обработки персональных данных является неограниченным. Пользователь может в любой момент отозвать свое согласие на обработку персональных данных, направив Оператору уведомление посредством электронной почты с пометкой «Отзыв согласия на обработку персональных данных».</p>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">7. Трансграничная передача персональных данных</h3>
            <p>7.1 Оператор до начала осуществления трансграничной передачи персональных данных обязан убедиться в том, что иностранным государством, на территорию которого предполагается осуществлять передачу персональных данных, обеспечивается надежная защита прав субъектов персональных данных.</p>
            <p className="mt-2">7.2 Трансграничная передача персональных данных на территории иностранных государств, не отвечающих вышеуказанным требованиям, может осуществляться только в случае наличия согласия в письменной форме субъекта персональных данных на трансграничную передачу его персональных данных и/или исполнения договора, стороной которого является субъект персональных данных.</p>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">8. Заключительные положения</h3>
            <p>8.1 Пользователь может получить любые разъяснения по интересующим вопросам, касающимся обработки его персональных данных, обратившись к Оператору с помощью электронной почты.</p>
            <p className="mt-2">8.2 В данном документе будут отражены любые изменения политики обработки персональных данных Оператором. Политика действует бессрочно до замены ее новой версией.</p>
            <p className="mt-2">8.3 Актуальная версия Политики в свободном доступе расположена в сети Интернет по адресу <span className="text-purple-400">https://landingguru.ru/privacy</span>.</p>
          </section>

        </div>

        <button
          onClick={onClose}
          className="btn-glow mt-8 w-full py-3 rounded-xl text-white font-semibold"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".section-reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-yellow-400 text-sm">★</span>
      ))}
    </div>
  );
}

export default function Index() {
  useReveal();
  const [form, setForm] = useState({ name: "", phone: "", comment: "" });
  const [submitted, setSubmitted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="noise-bg min-h-screen bg-[#09090f] text-white overflow-x-hidden">
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(9,9,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-glow flex items-center justify-center">
            <Icon name="Globe" size={16} className="text-white" />
          </div>
          <span className="font-oswald font-bold text-lg tracking-wide">LANDINGGURU.RU</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#advantages" className="hover:text-white transition-colors">Преимущества</a>
          <a href="#portfolio" className="hover:text-white transition-colors">Портфолио</a>
          <a href="#process" className="hover:text-white transition-colors">Процесс</a>
          <a href="#reviews" className="hover:text-white transition-colors">Отзывы</a>
        </div>
        <button onClick={scrollToForm}
          className="btn-glow px-5 py-2 rounded-full text-sm font-semibold text-white">
          Заказать
        </button>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="orb w-[600px] h-[600px] top-[-100px] left-[-200px]"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)" }} />
        <div className="orb w-[500px] h-[500px] bottom-[-100px] right-[-150px]"
          style={{ background: "radial-gradient(circle, rgba(0,245,255,0.1) 0%, transparent 70%)" }} />
        <div className="orb w-[300px] h-[300px] top-[40%] left-[40%]"
          style={{ background: "radial-gradient(circle, rgba(247,37,133,0.08) 0%, transparent 70%)" }} />

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{ border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.08)", color: "#c084fc" }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
            Принимаем заказы · Срок от 5 дней
          </div>

          <h1 className="font-oswald font-black text-6xl md:text-8xl lg:text-9xl leading-none mb-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}>
            ЛЕНДИНГ,
            <br />
            <span className="gradient-text">КОТОРЫЙ</span>
            <br />
            ПРОДАЁТ
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in"
            style={{ animationDelay: "0.3s" }}>
            Создаём продающие страницы под ключ. Уникальный дизайн, быстрая разработка и реальные заявки от клиентов.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
            style={{ animationDelay: "0.5s" }}>
            <button onClick={scrollToForm}
              className="btn-glow px-8 py-4 rounded-2xl text-white font-bold text-lg">
              Получить консультацию
            </button>
            <a href="#portfolio"
              className="btn-outline-glow px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2">
              Смотреть портфолио
              <Icon name="ArrowRight" size={20} />
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-20 max-w-xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.7s" }}>
            {[["120+", "Проектов"], ["5", "Дней"], ["2.5×", "Конверсия"]].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="font-oswald font-black text-4xl gradient-text">{val}</div>
                <div className="text-white/40 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center animate-float">
            <div className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-3 rounded-full bg-white/40"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 section-reveal">
            <span className="text-sm font-semibold uppercase tracking-widest text-purple-400 mb-4 block">Почему мы</span>
            <h2 className="font-oswald font-black text-5xl md:text-6xl mb-4">
              НАШИ <span className="gradient-text">ПРЕИМУЩЕСТВА</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Мы не просто делаем красивые сайты — мы создаём инструменты для бизнеса
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADVANTAGES.map((adv, i) => (
              <div key={adv.title}
                className="glass-card glass-card-hover rounded-2xl p-7 section-reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${adv.color}20`, border: `1px solid ${adv.color}40` }}>
                  <Icon name={adv.icon} size={22} style={{ color: adv.color }} />
                </div>
                <h3 className="font-oswald font-bold text-xl mb-2 text-white">{adv.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="py-32 px-6 relative">
        <div className="orb w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ background: "radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 section-reveal">
            <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-4 block">Наши работы</span>
            <h2 className="font-oswald font-black text-5xl md:text-6xl mb-4">
              <span className="gradient-text">ПОРТФОЛИО</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Каждый проект — уникальное решение для конкретного бизнеса
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PORTFOLIO.map((item, i) => (
              <div key={item.title}
                className="group relative rounded-2xl overflow-hidden section-reveal cursor-pointer"
                style={{ transitionDelay: `${i * 0.15}s`, aspectRatio: "4/3" }}>
                <img src={item.img} alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)" }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `${item.color}20` }} />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="text-xs font-semibold uppercase tracking-widest mb-2 block"
                    style={{ color: item.color }}>{item.category}</span>
                  <h3 className="font-oswald font-bold text-2xl text-white">{item.title}</h3>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: item.color }}>
                    <Icon name="ArrowUpRight" size={18} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 section-reveal">
            <span className="text-sm font-semibold uppercase tracking-widest text-pink-400 mb-4 block">Как мы работаем</span>
            <h2 className="font-oswald font-black text-5xl md:text-6xl mb-4">
              ПРОЦЕСС <span className="gradient-text-pink">РАБОТЫ</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Прозрачно, предсказуемо, без сюрпризов
            </p>
          </div>

          <div className="space-y-4">
            {PROCESS.map((step, i) => (
              <div key={step.num}
                className="glass-card glass-card-hover rounded-2xl p-7 flex gap-6 items-start section-reveal"
                style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="num-badge mt-1">{step.num}</div>
                <div>
                  <h3 className="font-oswald font-bold text-xl mb-2 text-white">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-32 px-6 relative">
        <div className="orb w-[500px] h-[500px] bottom-0 right-0"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 section-reveal">
            <span className="text-sm font-semibold uppercase tracking-widest text-yellow-400 mb-4 block">Клиенты о нас</span>
            <h2 className="font-oswald font-black text-5xl md:text-6xl mb-4">
              <span className="gradient-text">ОТЗЫВЫ</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <div key={r.name}
                className="glass-card glass-card-hover rounded-2xl p-7 section-reveal"
                style={{ transitionDelay: `${i * 0.1}s` }}>
                <StarRating count={r.rating} />
                <p className="text-white/70 text-sm leading-relaxed mt-4 mb-6">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #a855f7, #00f5ff)" }}>
                    {r.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">{r.name}</div>
                    <div className="text-white/40 text-xs">{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + FORM */}
      <section id="order" className="py-32 px-6 relative">
        <div className="orb w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)" }} />
        <div className="max-w-2xl mx-auto relative z-10" ref={formRef}>
          <div className="text-center mb-12 section-reveal">
            <span className="text-sm font-semibold uppercase tracking-widest text-purple-400 mb-4 block">Начнём прямо сейчас</span>
            <h2 className="font-oswald font-black text-5xl md:text-6xl mb-4">
              ОСТАВЬТЕ <span className="gradient-text">ЗАЯВКУ</span>
            </h2>
            <p className="text-white/50 text-lg">
              Ответим в течение 30 минут и обсудим ваш проект
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 section-reveal"
            style={{ border: "1px solid rgba(168,85,247,0.2)" }}>
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #a855f7, #00f5ff)" }}>
                  <Icon name="Check" size={28} className="text-white" />
                </div>
                <h3 className="font-oswald font-bold text-3xl mb-3 gradient-text">Заявка принята!</h3>
                <p className="text-white/60">Мы свяжемся с вами в течение 30 минут. Ожидайте звонок.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Ваше имя</label>
                  <input
                    type="text"
                    required
                    placeholder="Как вас зовут?"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontFamily: "Golos Text, sans-serif",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Телефон</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 (___) ___-__-__"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontFamily: "Golos Text, sans-serif",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">О проекте (необязательно)</label>
                  <textarea
                    rows={3}
                    placeholder="Расскажите о вашем бизнесе и задаче..."
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 outline-none transition-all resize-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontFamily: "Golos Text, sans-serif",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.6)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
                <button type="submit"
                  className="btn-glow w-full py-4 rounded-xl text-white font-bold text-lg mt-2">
                  Отправить заявку
                </button>
                <p className="text-center text-white/30 text-xs">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                </p>
              </form>
            )}
          </div>

          <div className="flex justify-center gap-8 mt-8 section-reveal">
            {[["🔒", "Безопасно"], ["⚡", "30 мин"], ["✅", "Договор"]].map(([icon, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-white/40 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg btn-glow flex items-center justify-center">
              <Icon name="Globe" size={14} className="text-white" />
            </div>
            <span className="font-oswald font-bold tracking-wide">LANDINGGURU.RU</span>
          </div>
          <p className="text-white/30 text-sm">© 2026 LandingGuru.ru. Все права защищены.</p>
          <div className="flex gap-6 text-sm text-white/40">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-white/70 transition-colors">Политика конфиденциальности</button>
          </div>
        </div>
      </footer>

    </div>
  );
}