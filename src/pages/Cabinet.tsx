import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Новый', color: '#a855f7' },
  in_progress: { label: 'В работе', color: '#00f5ff' },
  review: { label: 'На согласовании', color: '#facc15' },
  done: { label: 'Готово', color: '#4ade80' },
};

type Project = { id: number; title: string; status: string; description: string; updated_at: string };
type Message = { id: number; text: string; author: string; is_admin: boolean; created_at: string };
type FileItem = { id: number; name: string; url: string; file_type: string };
type Invoice = { id: number; title: string; amount: number; status: string; file_url: string };

export default function Cabinet() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<Project | null>(null);
  const [tab, setTab] = useState<'messages' | 'files' | 'invoices'>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(res => {
      if (res.error) { navigate('/login'); return; }
      if (res.is_admin) { navigate('/admin'); return; }
      setUser(res);
    });
    api.getProjects().then(res => {
      setProjects(res.projects || []);
      setLoading(false);
    });
  }, [navigate]);

  const openProject = async (p: Project) => {
    setActive(p);
    setTab('messages');
    loadTab('messages', p.id);
  };

  const loadTab = async (t: string, pid: number) => {
    if (t === 'messages') {
      const r = await api.getMessages(pid);
      setMessages(r.messages || []);
    } else if (t === 'files') {
      const r = await api.getFiles(pid);
      setFiles(r.files || []);
    } else if (t === 'invoices') {
      const r = await api.getInvoices(pid);
      setInvoices(r.invoices || []);
    }
  };

  const switchTab = (t: 'messages' | 'files' | 'invoices') => {
    setTab(t);
    if (active) loadTab(t, active.id);
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !active) return;
    const res = await api.sendMessage(active.id, msgText);
    setMessages(prev => [...prev, res]);
    setMsgText('');
  };

  const logout = async () => {
    await api.logout();
    localStorage.removeItem('session_id');
    navigate('/login');
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center">
        <div className="text-white/40 text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a855f7, #00f5ff)' }}>
            <Icon name="Globe" size={15} className="text-white" />
          </div>
          <span className="font-['Oswald'] font-bold tracking-wide hidden sm:block">LANDINGGURU.RU</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-sm hidden sm:block">{user?.name}</span>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
            <Icon name="LogOut" size={15} />
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-6">
        {/* Projects list */}
        <div className="lg:w-72 shrink-0">
          <h2 className="font-['Oswald'] font-bold text-lg mb-4 text-white/70 uppercase tracking-wide">Мои проекты</h2>
          {projects.length === 0 ? (
            <div className="rounded-2xl p-6 text-center text-white/30 text-sm" style={cardStyle}>
              Проектов пока нет
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(p => {
                const s = STATUS_LABELS[p.status] || { label: p.status, color: '#a855f7' };
                return (
                  <button key={p.id} onClick={() => openProject(p)}
                    className="w-full text-left rounded-2xl p-4 transition-all"
                    style={{ ...cardStyle, borderColor: active?.id === p.id ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)' }}>
                    <div className="font-semibold text-sm mb-2">{p.title}</div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${s.color}20`, color: s.color }}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Project detail */}
        <div className="flex-1">
          {!active ? (
            <div className="rounded-2xl p-12 text-center" style={cardStyle}>
              <Icon name="FolderOpen" size={40} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/30">Выберите проект слева</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              {/* Project header */}
              <div className="p-5 sm:p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-['Oswald'] font-bold text-2xl mb-1">{active.title}</h1>
                    {active.description && <p className="text-white/40 text-sm">{active.description}</p>}
                  </div>
                  {(() => {
                    const s = STATUS_LABELS[active.status] || { label: active.status, color: '#a855f7' };
                    return (
                      <span className="text-sm font-semibold px-3 py-1 rounded-full shrink-0"
                        style={{ background: `${s.color}20`, color: s.color }}>
                        {s.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {([['messages', 'MessageSquare', 'Переписка'], ['files', 'Paperclip', 'Файлы'], ['invoices', 'Receipt', 'Счета']] as const).map(([t, icon, label]) => (
                  <button key={t} onClick={() => switchTab(t)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors"
                    style={{ color: tab === t ? '#a855f7' : 'rgba(255,255,255,0.4)', borderBottom: tab === t ? '2px solid #a855f7' : '2px solid transparent' }}>
                    <Icon name={icon} size={15} />
                    <span className="hidden sm:block">{label}</span>
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5 sm:p-6">
                {tab === 'messages' && (
                  <div>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {messages.length === 0 && <p className="text-white/30 text-sm text-center py-6">Сообщений пока нет</p>}
                      {messages.map(m => (
                        <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                          <div className="max-w-xs sm:max-w-md rounded-2xl px-4 py-3 text-sm"
                            style={m.is_admin
                              ? { background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }
                              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {m.is_admin && <div className="text-xs text-purple-400 mb-1 font-semibold">Команда</div>}
                            <p className="text-white/80">{m.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={msgText} onChange={e => setMsgText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Написать сообщение..."
                        className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <button onClick={sendMessage}
                        className="px-4 py-3 rounded-xl transition-opacity hover:opacity-80"
                        style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                        <Icon name="Send" size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {tab === 'files' && (
                  <div className="space-y-2">
                    {files.length === 0 && <p className="text-white/30 text-sm text-center py-6">Файлов пока нет</p>}
                    {files.map(f => (
                      <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(168,85,247,0.15)' }}>
                          <Icon name="FileText" size={16} className="text-purple-400" />
                        </div>
                        <span className="text-sm text-white/70 group-hover:text-white transition-colors flex-1">{f.name}</span>
                        <Icon name="ExternalLink" size={14} className="text-white/30 group-hover:text-white/60" />
                      </a>
                    ))}
                  </div>
                )}

                {tab === 'invoices' && (
                  <div className="space-y-3">
                    {invoices.length === 0 && <p className="text-white/30 text-sm text-center py-6">Счетов пока нет</p>}
                    {invoices.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div>
                          <div className="font-semibold text-sm">{inv.title}</div>
                          <div className="text-white/40 text-xs mt-0.5">
                            {inv.status === 'paid' ? '✅ Оплачен' : inv.status === 'pending' ? '⏳ Ожидает оплаты' : inv.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-purple-400">{inv.amount.toLocaleString()} ₽</span>
                          {inv.file_url && (
                            <a href={inv.file_url} target="_blank" rel="noreferrer"
                              className="text-white/40 hover:text-white/70 transition-colors">
                              <Icon name="Download" size={15} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
