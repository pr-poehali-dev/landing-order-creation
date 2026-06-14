import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCityBySlug } from "@/data/cities";
import Index from "./Index";

const SITE = "https://landingguru.ru";

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector<HTMLElement>(selector);
  if (el) el.setAttribute(attr, value);
}

export default function CityLanding() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const city = getCityBySlug(citySlug || "");

  useEffect(() => {
    if (!city) {
      navigate("/", { replace: true });
      return;
    }

    const url = `${SITE}/landing/${city.slug}`;
    const title = `Заказать лендинг в ${city.nameIn} — LandingGuru.ru | Создание продающих сайтов`;
    const description = `Создаём продающие лендинги под ключ в ${city.nameIn} за 5 дней. Уникальный дизайн, мобильная адаптация, SEO и аналитика. Гарантия результата — реальные заявки.`;

    const prevTitle = document.title;
    document.title = title;

    setMeta('link[rel="canonical"]', "href", url);
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);

    return () => {
      document.title = prevTitle;
      setMeta('link[rel="canonical"]', "href", `${SITE}/`);
      setMeta('meta[property="og:url"]', "content", `${SITE}/`);
    };
  }, [city, navigate]);

  if (!city) return null;

  return <Index city={city} />;
}