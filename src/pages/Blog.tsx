import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

const SITE = "https://landingguru.ru";

type ArticleCard = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover_url: string;
  created_at: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function Blog() {
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Блог о создании лендингов — LandingGuru.ru";
    const desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", "Статьи о создании продающих лендингов, конверсии, дизайне и продвижении сайтов.");
    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `${SITE}/blog`);

    api.getPublicContent()
      .then(d => {
        if (d.sections?.blog && Array.isArray(d.articles)) setArticles(d.articles);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="noise-bg min-h-screen bg-[#09090f] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
        style={{ background: "rgba(9,9,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-glow flex items-center justify-center">
            <Icon name="Globe" size={16} className="text-white" />
          </div>
          <span className="font-oswald font-bold text-base sm:text-lg tracking-wide">LANDINGGURU.RU</span>
        </a>
        <a href="/" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white/60 hover:text-white transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <Icon name="ArrowLeft" size={15} /> На главную
        </a>
      </nav>

      <section className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold uppercase tracking-widest text-purple-400 mb-4 block">Блог</span>
            <h1 className="font-oswald font-black text-4xl sm:text-6xl mb-4">
              СТАТЬИ О <span className="gradient-text">ЛЕНДИНГАХ</span>
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Полезные материалы о создании продающих сайтов и привлечении клиентов
            </p>
          </div>

          {loading && <p className="text-center text-white/40">Загрузка…</p>}
          {!loading && articles.length === 0 && (
            <p className="text-center text-white/40">Статей пока нет. Скоро здесь появятся первые материалы.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map(a => (
              <a key={a.id} href={`/blog/${a.slug}`}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col group">
                <div className="aspect-[16/9] bg-white/5 overflow-hidden">
                  {a.cover_url
                    ? <img src={a.cover_url} alt={a.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center"><Icon name="Newspaper" size={40} className="text-white/20" /></div>}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-white/30 text-xs mb-2">{formatDate(a.created_at)}</div>
                  <h2 className="font-oswald font-bold text-xl mb-2">{a.title}</h2>
                  {a.excerpt && <p className="text-white/50 text-sm leading-relaxed line-clamp-3 flex-1">{a.excerpt}</p>}
                  <span className="text-purple-400 text-sm font-semibold mt-4 inline-flex items-center gap-1">
                    Читать <Icon name="ArrowRight" size={15} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
