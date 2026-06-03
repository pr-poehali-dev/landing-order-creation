import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCityBySlug } from "@/data/cities";
import Index from "./Index";

export default function CityLanding() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const city = getCityBySlug(citySlug || "");

  useEffect(() => {
    if (!city) navigate("/", { replace: true });
  }, [city, navigate]);

  if (!city) return null;

  return <Index city={city} />;
}
