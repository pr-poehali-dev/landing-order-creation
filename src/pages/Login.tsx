import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

type Mode = 'login' | 'twofa' | 'reset_request' | 'reset_confirm';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const finishLogin = (res: any) => {
    localStorage.setItem('session_id', res.session_id);
    if (res.user.is_admin) navigate('/admin');
    else navigate('/cabinet');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    const res = await api.login(email, password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    if (res.need_2fa) {
      setEmailHint(res.email_hint || '');
      setMode('twofa');
      setInfo('Мы отправили 8-значный код на вашу почту');
      return;
    }
    finishLogin(res);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await api.verifyLogin(email, code);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    finishLogin(res);
  };

  const handleResendCode = async () => {
    setError(''); setInfo(''); setLoading(true);
    const res = await api.login(email, password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setInfo('Новый код отправлен на почту');
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    await api.requestReset(email);
    setLoading(false);
    setMode('reset_confirm');
    setInfo('Если email привязан к админу — на него отправлен код для сброса');
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await api.resetPassword(email, code, newPassword);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setMode('login');
    setPassword(''); setCode(''); setNewPassword('');
    setInfo('Пароль изменён. Войдите с новым паролем');
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    fontFamily: 'Golos Text, sans-serif',
  };

  const inputCls = 'w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 outline-none transition-all';
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'rgba(168,85,247,0.6)');
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)');

  const titles: Record<Mode, string> = {
    login: 'ЛИЧНЫЙ КАБИНЕТ',
    twofa: 'ПОДТВЕРЖДЕНИЕ ВХОДА',
    reset_request: 'СБРОС ПАРОЛЯ',
    reset_confirm: 'НОВЫЙ ПАРОЛЬ',
  };
  const subtitles: Record<Mode, string> = {
    login: 'Войдите, чтобы отслеживать проект',
    twofa: 'Введите код из письма',
    reset_request: 'Укажите email администратора',
    reset_confirm: 'Введите код из письма и новый пароль',
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
          <h1 className="text-white font-['Oswald'] font-black text-3xl mb-2">{titles[mode]}</h1>
          <p className="text-white/40 text-sm">{subtitles[mode]}</p>
        </div>

        <div className="rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.2)' }}>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.ru" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Пароль</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              {info && <p className="text-emerald-400 text-sm text-center">{info}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl text-white font-bold text-base mt-2 transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                {loading ? 'Входим...' : 'Войти'}
              </button>
              <button type="button" onClick={() => { setError(''); setInfo(''); setMode('reset_request'); }}
                className="w-full text-white/40 text-sm hover:text-white/70 transition-colors pt-1">
                Забыли пароль?
              </button>
            </form>
          )}

          {mode === 'twofa' && (
            <form onSubmit={handleVerify} className="space-y-4">
              {emailHint && <p className="text-white/40 text-xs text-center">Код отправлен на {emailHint}</p>}
              <div>
                <label className="block text-sm text-white/60 mb-2">Код из письма</label>
                <input type="text" inputMode="numeric" required value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="8 цифр" maxLength={8}
                  className={inputCls + ' text-center tracking-[0.5em] text-xl'} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              {info && <p className="text-emerald-400 text-sm text-center">{info}</p>}
              <button type="submit" disabled={loading || code.length !== 8}
                className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                {loading ? 'Проверяем...' : 'Подтвердить'}
              </button>
              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => { setError(''); setInfo(''); setCode(''); setMode('login'); }}
                  className="text-white/40 text-sm hover:text-white/70 transition-colors">Назад</button>
                <button type="button" onClick={handleResendCode} disabled={loading}
                  className="text-white/40 text-sm hover:text-white/70 transition-colors disabled:opacity-50">Отправить код повторно</button>
              </div>
            </form>
          )}

          {mode === 'reset_request' && (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Email администратора</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.ru" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                {loading ? 'Отправляем...' : 'Отправить код'}
              </button>
              <button type="button" onClick={() => { setError(''); setInfo(''); setMode('login'); }}
                className="w-full text-white/40 text-sm hover:text-white/70 transition-colors pt-1">Назад ко входу</button>
            </form>
          )}

          {mode === 'reset_confirm' && (
            <form onSubmit={handleResetConfirm} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Код из письма</label>
                <input type="text" inputMode="numeric" required value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="8 цифр" maxLength={8}
                  className={inputCls + ' text-center tracking-[0.5em] text-xl'} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Новый пароль</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              {info && <p className="text-emerald-400 text-sm text-center">{info}</p>}
              <button type="submit" disabled={loading || code.length !== 8}
                className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                {loading ? 'Сохраняем...' : 'Сменить пароль'}
              </button>
              <button type="button" onClick={() => { setError(''); setInfo(''); setCode(''); setMode('login'); }}
                className="w-full text-white/40 text-sm hover:text-white/70 transition-colors pt-1">Назад ко входу</button>
            </form>
          )}
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
