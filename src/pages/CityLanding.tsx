import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCityBySlug, CITIES } from "@/data/cities";
import Icon from "@/components/ui/icon";

const ADVANTAGES = [
  { icon: "Zap", title: "Быстрая разработка", desc: "Готовый лендинг от 5 дней. Работаем чётко по срокам.", color: "#a855f7" },
  { icon: "TrendingUp", title: "Конверсия в заявки", desc: "Проектируем путь клиента так, чтобы он хотел позвонить или оставить заявку.", color: "#00f5ff" },
  { icon: "Palette", title: "Уникальный дизайн", desc: "Никаких шаблонов. Каждый проект — отдельная дизайн-концепция под ваш бренд.", color: "#f72585" },
  { icon: "Shield", title: "Гарантия результата", desc: "Фиксированная цена в договоре. Правки включены. Работаем до принятия.", color: "#4ade80" },
  { icon: "Smartphone", title: "Мобильная адаптация", desc: "Сайт идеально выглядит на любом устройстве — телефоне, планшете, ноутбуке.", color: "#fb923c" },
  { icon: "BarChart3", title: "Аналитика и SEO", desc: "Подключаем Яндекс.Метрику и Google Analytics. Базовое SEO в подарок.", color: "#facc15" },
];

const PROCESS = [
  { num: "01", title: "Заявка и бриф", desc: "Вы оставляете заявку. Мы связываемся и задаём вопросы о вашем бизнесе." },
  { num: "02", title: "Дизайн-концепция", desc: "Разрабатываем уникальный визуал: цвета, шрифты, структуру страницы." },
  { num: "03", title: "Разработка", desc: "Верстаем и программируем. Подключаем формы, аналитику и всё нужное." },
  { num: "04", title: "Запуск и поддержка", desc: "Публикуем сайт, настраиваем домен. 30 дней — бесплатные правки." },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".cr-reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function CityLanding() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const city = getCityBySlug(citySlug || "");
  const [form, setForm] = useState({ name: "", phone: "", comment: "" });
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  useReveal();

  useEffect(() => {
    if (!city) { navigate("/", { replace: true }); return; }
    document.title = `Создание лендинга в ${city.nameIn} — LandingGuru.ru`;
    const desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", `Заказать лендинг в ${city.nameIn} под ключ. Разработка за 5 дней, уникальный дизайн, гарантия результата. ${city.population} жителей — ваши потенциальные клиенты.`);
  }, [city, navigate]);

  if (!city) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("https://functions.poehali.dev/03da1169-73aa-4c48-b325-94ad3d6e3160", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, city: city.name }),
    });
    setSubmitted(true);
  };

  return (
    <div className="noise-bg min-h-screen bg-[#09090f] text-white overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
        style={{ background: "rgba(9,9,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-glow flex items-center justify-center shrink-0">
            <Icon name="Globe" size={16} className="text-white" />
          </div>
          <span className="font-oswald font-bold text-base sm:text-lg tracking-wide">LANDINGGURU.RU</span>
        </a>
        <div className="flex items-center gap-2">
          <a href="/login"
            className="px-4 py-2 rounded-full text-sm font-semibold text-white/60 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            Вход
          </a>
          <button onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="btn-glow px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold text-white">
            Заказать
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 pb-10">
        <div className="orb w-[600px] h-[600px] top-[-100px] left-[-200px]"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)" }} />
        <div className="orb w-[500px] h-[500px] bottom-[-100px] right-[-150px]"
          style={{ background: "radial-gradient(circle, rgba(0,245,255,0.1) 0%, transparent 70%)" }} />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{ border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.08)", color: "#c084fc" }}>
            <Icon name="MapPin" size={14} />
            {city.name} · {city.region}
          </div>

          <h1 className="font-oswald font-black text-4xl sm:text-6xl lg:text-7xl leading-none tracking-tight mb-6">
            <span className="text-white">СОЗДАНИЕ </span>
            <span className="gradient-text">ЛЕНДИНГА</span>
            <br />
            <span className="text-white">В {city.name.toUpperCase()}</span>
          </h1>

          <p className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Разрабатываем продающие лендинги в {city.nameIn} под ключ. Уникальный дизайн, мобильная адаптация, настройка аналитики. Готово за 5 рабочих дней.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="btn-glow px-8 py-4 rounded-full text-lg font-bold text-white">
              Заказать лендинг в {city.nameIn}
            </button>
            <a href="/"
              className="px-8 py-4 rounded-full text-lg font-semibold text-white/60 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              Смотреть портфолио
            </a>
          </div>

          <div className="flex justify-center gap-8 mt-12 text-center">
            {[["5 дней", "срок разработки"], ["100+", "проектов сдано"], ["30 дней", "бесплатная поддержка"]].map(([v, l]) => (
              <div key={l}>
                <div className="font-oswald font-black text-2xl sm:text-3xl gradient-text">{v}</div>
                <div className="text-white/40 text-sm mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ПРЕИМУЩЕСТВА */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto cr-reveal">
        <div className="text-center mb-12">
          <h2 className="font-oswald font-black text-3xl sm:text-5xl text-white mb-4">
            ПОЧЕМУ ВЫБИРАЮТ НАС<br />
            <span className="gradient-text">В {city.name.toUpperCase()}</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Работаем с бизнесом в {city.nameIn} и знаем, как сделать сайт, который приносит заявки
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADVANTAGES.map(a => (
            <div key={a.title} className="p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${a.color}18` }}>
                <Icon name={a.icon as "Zap"} size={22} style={{ color: a.color }} />
              </div>
              <h3 className="font-oswald font-bold text-lg text-white mb-2">{a.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ПРОЦЕСС */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto cr-reveal">
        <div className="text-center mb-12">
          <h2 className="font-oswald font-black text-3xl sm:text-5xl text-white mb-4">
            КАК МЫ РАБОТАЕМ<br />
            <span className="gradient-text">С КЛИЕНТАМИ В {city.name.toUpperCase()}</span>
          </h2>
        </div>
        <div className="space-y-4">
          {PROCESS.map((p, i) => (
            <div key={i} className="flex gap-6 p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="font-oswald font-black text-3xl shrink-0" style={{ color: "rgba(168,85,247,0.4)" }}>{p.num}</span>
              <div>
                <h3 className="font-oswald font-bold text-lg text-white mb-1">{p.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ФОРМА */}
      <section ref={formRef} className="py-20 px-4 sm:px-6 max-w-xl mx-auto cr-reveal">
        <div className="text-center mb-10">
          <h2 className="font-oswald font-black text-3xl sm:text-4xl text-white mb-3">
            ЗАКАЗАТЬ ЛЕНДИНГ<br />
            <span className="gradient-text">В {city.name.toUpperCase()}</span>
          </h2>
          <p className="text-white/40">Оставьте заявку — ответим в течение 1 часа</p>
        </div>

        {submitted ? (
          <div className="text-center py-12 px-6 rounded-2xl"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="font-oswald font-bold text-2xl text-white mb-2">Заявка принята!</h3>
            <p className="text-white/50">Свяжемся с вами в ближайшее время</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-8 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <input required placeholder="Ваше имя"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-purple-500/50 transition-colors text-sm" />
            <input required placeholder="Телефон" type="tel"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-purple-500/50 transition-colors text-sm" />
            <textarea placeholder={`Расскажите о вашем бизнесе в ${city.nameIn}`} rows={3}
              value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-purple-500/50 transition-colors text-sm resize-none" />
            <button type="submit"
              className="btn-glow w-full py-4 rounded-xl text-white font-bold text-lg">
              Получить консультацию бесплатно
            </button>
            <p className="text-white/20 text-xs text-center">
              Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
            </p>
          </form>
        )}
      </section>

      {/* ДРУГИЕ ГОРОДА */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto cr-reveal">
        <h2 className="font-oswald font-black text-2xl text-white mb-6 text-center">
          Также работаем в других городах
        </h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {CITIES.filter(c => c.slug !== city.slug).slice(0, 24).map(c => (
            <a key={c.slug} href={`/landing-${c.slug}`}
              className="px-3 py-1.5 rounded-full text-sm text-white/40 hover:text-white/70 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {c.name}
            </a>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 sm:px-6 text-center border-t border-white/5">
        <p className="text-white/20 text-sm">
          © 2024 LandingGuru.ru — Создание лендингов в {city.nameIn}
        </p>
      </footer>
    </div>
  );
}
