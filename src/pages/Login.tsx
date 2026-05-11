import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await api.login(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    localStorage.setItem('session_id', res.session_id);
    if (res.user.is_admin) {
      navigate('/admin');
    } else {
      navigate('/cabinet');
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    fontFamily: 'Golos Text, sans-serif',
  };

  return (
    <div className="min-h-screen bg-[#09090f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #a855f7, #00f5ff)' }}>
              <Icon name="Globe" size={18} className="text-white" />
            </div>
            <span className="font-['Oswald'] font-bold text-xl text-white tracking-wide">LANDINGGURU.RU</span>
          </div>
          <h1 className="text-white font-['Oswald'] font-black text-3xl mb-2">ЛИЧНЫЙ КАБИНЕТ</h1>
          <p className="text-white/40 text-sm">Войдите, чтобы отслеживать проект</p>
        </div>

        <div className="rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.ru"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 outline-none transition-all"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.6)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Пароль</label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 outline-none transition-all"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.6)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl text-white font-bold text-base mt-2 transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6">
          <a href="/" className="text-white/30 text-sm hover:text-white/60 transition-colors flex items-center justify-center gap-1.5">
            <Icon name="ArrowLeft" size={14} />
            На главную
          </a>
        </p>
      </div>
    </div>
  );
}
