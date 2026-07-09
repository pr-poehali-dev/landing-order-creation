import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { setFavicon } from '@/lib/favicon';
import { playNotification } from '@/lib/notification';
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
  const activeRef = useRef<Project | null>(null);
  const lastMsgCountRef = useRef<Record<number, number>>({});
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('sound_off') !== '1');
  const soundOnRef = useRef(soundOn);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);
  const toggleSound = () => setSoundOn(v => { localStorage.setItem('sound_off', v ? '1' : '0'); return !v; });

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const total = Object.values(unread).reduce((s, n) => s + n, 0);
    const base = 'Кабинет — LandingGuru';
    setFavicon(total);
    if (total === 0) {
      document.title = base;
      return () => { document.title = 'LandingGuru'; };
    }
    let flip = false;
    const flash = `💬 ${total} ${total === 1 ? 'новое сообщение' : 'новых сообщений'}`;
    const counter = `(${total}) ${base}`;
    document.title = flash;
    const blink = setInterval(() => {
      flip = !flip;
      document.title = flip ? counter : flash;
    }, 1000);
    return () => { clearInterval(blink); document.title = 'LandingGuru'; };
  }, [unread]);

  useEffect(() => {
    api.me().then(res => {
      if (res.error) { navigate('/login'); return; }
      if (res.is_admin) { navigate('/admin'); return; }
      setUser(res);
    });
    api.getProjects().then(async res => {
      const projs: Project[] = res.projects || [];
      setProjects(projs);
      setLoading(false);
      // Инициализируем baseline счётчиков сразу при загрузке
      for (const proj of projs) {
        if (lastMsgCountRef.current[proj.id] === undefined) {
          const r = await api.getMessages(proj.id);
          const msgs: Message[] = r.messages || [];
          lastMsgCountRef.current[proj.id] = msgs.filter(m => m.is_admin).length;
        }
      }
    });

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(async () => {
      const res = await api.getProjects();
      const allProjects: Project[] = res.projects || [];
      setProjects(allProjects);
      for (const proj of allProjects) {
        const r = await api.getMessages(proj.id);
        const msgs: Message[] = r.messages || [];
        const adminMsgs = msgs.filter(m => m.is_admin);
        const prev = lastMsgCountRef.current[proj.id] ?? adminMsgs.length;
        if (adminMsgs.length > prev) {
          if (soundOnRef.current) playNotification(660, 880);
          if (Notification.permission === 'granted') {
            new Notification(`💬 Новое сообщение — ${proj.title}`, {
              body: adminMsgs[adminMsgs.length - 1]?.text || 'Команда написала вам',
              icon: '/favicon.ico',
            });
          }
          if (activeRef.current?.id === proj.id) {
            setMessages(msgs);
          } else {
            setUnread(prev => ({ ...prev, [proj.id]: (prev[proj.id] || 0) + (adminMsgs.length - (lastMsgCountRef.current[proj.id] ?? adminMsgs.length)) }));
          }
        } else if (activeRef.current?.id === proj.id) {
          setMessages(msgs);
          // убираем лишний else
        }
        lastMsgCountRef.current[proj.id] = adminMsgs.length;
      }
      // Проверяем typing для открытого проекта
      if (activeRef.current) {
        const t = await api.getTyping(activeRef.current.id);
        setPeerTyping(t.is_typing || false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  const openProject = async (p: Project) => {
    setActive(p);
    setTab('messages');
    setUnread(prev => ({ ...prev, [p.id]: 0 }));
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

  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputTabRef = useRef<HTMLInputElement>(null);

  const handleTabFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await api.uploadFile(active.id, file.name, base64);
      if (res.url) {
        setFiles(prev => [...prev, { id: res.id, name: res.name, url: res.url, file_type: res.file_type }]);
        api.notifyFileUploaded(active.id, res.name, res.url);
      }
      setUploadingFile(false);
      if (fileInputTabRef.current) fileInputTabRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await api.uploadFile(active.id, file.name, base64);
      if (res.url) {
        const text = res.file_type === 'image' ? `[img:${res.url}]` : `[file:${res.url}:${res.name}]`;
        const msgRes = await api.sendMessage(active.id, text);
        setMessages(prev => [...prev, msgRes]);
      }
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
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
          <button onClick={toggleSound} title={soundOn ? 'Звук включён' : 'Звук выключен'}
            className="flex items-center text-sm text-white/40 hover:text-white/70 transition-colors">
            <Icon name={soundOn ? 'Volume2' : 'VolumeX'} size={16} />
          </button>
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
                const hasUnread = (unread[p.id] || 0) > 0;
                return (
                  <button key={p.id} onClick={() => openProject(p)}
                    className="w-full text-left rounded-2xl p-4 transition-all"
                    style={{
                      ...cardStyle,
                      borderColor: active?.id === p.id ? 'rgba(168,85,247,0.5)' : hasUnread ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.08)',
                      background: hasUnread ? 'rgba(168,85,247,0.07)' : cardStyle.background,
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-sm">{p.title}</div>
                      {hasUnread && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#a855f7', color: 'white', minWidth: 20, textAlign: 'center' }}>
                          {unread[p.id]}
                        </span>
                      )}
                    </div>
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
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto" ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
                      {messages.length === 0 && <p className="text-white/30 text-sm text-center py-6">Сообщений пока нет</p>}
                      {messages.map(m => (
                        <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                          <div className="max-w-xs sm:max-w-md rounded-2xl px-4 py-3 text-sm"
                            style={m.is_admin
                              ? { background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }
                              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {m.is_admin && <div className="text-xs text-purple-400 mb-1 font-semibold">Команда</div>}
                            {m.text.startsWith('[img:') ? (
                              <a href={m.text.slice(5, -1)} target="_blank" rel="noreferrer">
                                <img src={m.text.slice(5, -1)} alt="img" className="max-w-[220px] rounded-xl mt-1" />
                              </a>
                            ) : m.text.startsWith('[file:') ? (() => {
                              const parts = m.text.slice(6, -1).split(':');
                              const url = parts[0]; const name = parts.slice(1).join(':');
                              return <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-purple-400 underline text-sm mt-1"><Icon name="Paperclip" size={13} />{name}</a>;
                            })() : <p className="text-white/80">{m.text}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {peerTyping && (
                      <div className="flex items-center gap-2 mb-2 text-white/40 text-xs">
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        Команда печатает...
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
                        className="px-3 py-3 rounded-xl transition-opacity hover:opacity-80"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Icon name={uploadingFile ? 'Loader' : 'Paperclip'} size={16} className="text-white/50" />
                      </button>
                      <input value={msgText} onChange={e => {
                          setMsgText(e.target.value);
                          if (active) {
                            api.sendTyping(active.id);
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                          }
                        }}
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
                  <div>
                    <input ref={fileInputTabRef} type="file" className="hidden" onChange={handleTabFileUpload} />
                    <button onClick={() => fileInputTabRef.current?.click()} disabled={uploadingFile}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mb-4"
                      style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                      <Icon name={uploadingFile ? 'Loader' : 'Paperclip'} size={14} />
                      {uploadingFile ? 'Загрузка...' : 'Загрузить файл'}
                    </button>
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