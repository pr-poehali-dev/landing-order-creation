import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const NotFoundRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(7);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    const redirect = setTimeout(() => navigate("/", { replace: true }), 7000);
    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className="noise-bg min-h-screen flex items-center justify-center bg-[#09090f] text-white px-4 overflow-hidden relative">
      <div className="orb w-[600px] h-[600px] top-[-100px] left-[-200px]"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)" }} />
      <div className="orb w-[500px] h-[500px] bottom-[-100px] right-[-150px]"
        style={{ background: "radial-gradient(circle, rgba(0,245,255,0.1) 0%, transparent 70%)" }} />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        <h1 className="font-oswald font-black text-8xl sm:text-9xl leading-none mb-4">
          <span className="gradient-text">404</span>
        </h1>
        <h2 className="font-oswald font-bold text-2xl sm:text-3xl mb-4">Страница не найдена</h2>
        <p className="text-white/50 text-lg mb-8">
          Похоже, такой страницы не существует. Перенаправляем вас на главную через{" "}
          <span className="text-white font-bold">{seconds}</span> сек.
        </p>

        <a href="/"
          className="btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg">
          <Icon name="Home" size={20} />
          Вернуться на главную
        </a>
      </div>
    </div>
  );
};

export default NotFoundRedirect;
