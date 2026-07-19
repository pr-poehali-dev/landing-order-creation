import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

const SITE = "https://landingguru.ru";

type ArticleData = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string;
  created_at: string;
};

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector<HTMLElement>(selector);
  if (el) el.setAttribute(attr, value);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getArticle(slug || "")
      .then(d => {
        if (cancelled) return;
        if (d.article) {
          setArticle(d.article);
          const url = `${SITE}/blog/${d.article.slug}`;
          const title = `${d.article.title} — LandingGuru.ru`;
          const description = d.article.excerpt || d.article.title;
          document.title = title;
          setMeta('link[rel="canonical"]', "href", url);
          setMeta('meta[name="description"]', "content", description);
          setMeta('meta[property="og:url"]', "content", url);
          setMeta('meta[property="og:title"]', "content", title);
          setMeta('meta[property="og:description"]', "content", description);
          if (d.article.cover_url) setMeta('meta[property="og:image"]', "content", d.article.cover_url);
        } else {
          navigate("/blog", { replace: true });
        }
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setLoading(false); navigate("/blog", { replace: true }); } });
    return () => { cancelled = true; };
  }, [slug, navigate]);

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
        <a href="/blog" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white/60 hover:text-white transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <Icon name="ArrowLeft" size={15} /> Все статьи
        </a>
      </nav>

      {loading && <div className="pt-40 text-center text-white/40">Загрузка…</div>}

      {article && (
        <article className="pt-28 sm:pt-36 pb-24 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-white/30 text-sm mb-3">{formatDate(article.created_at)}</div>
            <h1 className="font-oswald font-black text-3xl sm:text-5xl mb-6 leading-tight">{article.title}</h1>
            {article.cover_url && (
              <div className="rounded-2xl overflow-hidden mb-8" style={{ border: "1px solid rgba(168,85,247,0.2)" }}>
                <img src={article.cover_url} alt={article.title} className="w-full h-auto block" />
              </div>
            )}
            {article.excerpt && (
              <p className="text-white/60 text-lg leading-relaxed mb-8 font-medium">{article.excerpt}</p>
            )}
            <div className="text-white/70 text-base leading-relaxed whitespace-pre-line">{article.content}</div>

            <div className="mt-14 p-8 rounded-2xl text-center" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <h3 className="font-oswald font-bold text-2xl mb-3">Нужен продающий лендинг?</h3>
              <p className="text-white/50 mb-6">Создадим сайт под ключ за 5 дней с гарантией результата</p>
              <a href="/#order" className="btn-glow inline-block px-8 py-3.5 rounded-full text-white font-bold">
                Оставить заявку
              </a>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
