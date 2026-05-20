import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

function playNotification() {
  const ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'review', label: 'На согласовании' },
  { value: 'done', label: 'Готово' },
];

const STATUS_COLORS: Record<string, string> = {
  new: '#a855f7', in_progress: '#00f5ff', review: '#facc15', done: '#4ade80',
};

type User = { id: number; name: string; email: string; created_at: string };
type Project = { id: number; user_id: number; title: string; status: string; description: string; client_name: string };

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'projects' | 'users'>('projects');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [subTab, setSubTab] = useState<'messages' | 'files' | 'invoices'>('messages');
  const [messages, setMessages] = useState<{id:number;text:string;author:string;is_admin:boolean}[]>([]);
  const [files, setFiles] = useState<{id:number;name:string;url:string;file_type:string}[]>([]);
  const [invoices, setInvoices] = useState<{id:number;title:string;amount:number;status:string;file_url:string}[]>([]);
  const [msgText, setMsgText] = useState('');
  const [showNewUser, setShowNewUser] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [newProject, setNewProject] = useState({ user_id: 0, title: '', status: 'new', description: '' });
  const [newFile, setNewFile] = useState({ name: '', url: '', file_type: '' });
  const [newInvoice, setNewInvoice] = useState({ title: '', amount: '', file_url: '' });
  const [showFileForm, setShowFileForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const lastMsgCountRef = useRef<Record<number, number>>({});
  const selectedProjectRef = useRef<Project | null>(null);
  const messagesRef = useRef<{id:number;text:string;author:string;is_admin:boolean}[]>([]);
  const openProjectRef = useRef<((p: Project, msgs?: {id:number;text:string;author:string;is_admin:boolean}[]) => void) | null>(null);

  useEffect(() => { selectedProjectRef.current = selectedProject; }, [selectedProject]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    api.me().then(res => {
      if (res.error || !res.is_admin) { navigate('/login'); return; }
    });
    loadData();

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(async () => {
      const p = await api.adminGetProjects();
      const allProjects: Project[] = p.projects || [];
      for (const proj of allProjects) {
        const r = await api.getMessages(proj.id);
        const msgs: {id:number;is_admin:boolean;text:string;author:string}[] = r.messages || [];
        const clientMsgs = msgs.filter(m => !m.is_admin);
        const prev = lastMsgCountRef.current[proj.id] ?? clientMsgs.length;
        if (clientMsgs.length > prev) {
          playNotification();
          const lastMsg = clientMsgs[clientMsgs.length - 1];
          if (Notification.permission === 'granted') {
            const notif = new Notification(`💬 ${proj.client_name} — ${proj.title}`, {
              body: lastMsg?.text || 'Новое сообщение',
              icon: '/favicon.ico',
            });
            notif.onclick = () => {
              window.focus();
              openProjectRef.current?.(proj, r.messages || []);
            };
          }
          if (selectedProjectRef.current?.id === proj.id) {
            setMessages(r.messages || []);
          }
        }
        lastMsgCountRef.current[proj.id] = clientMsgs.length;
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [navigate]);

  const loadData = async () => {
    const [u, p] = await Promise.all([api.adminGetUsers(), api.adminGetProjects()]);
    setUsers(u.users || []);
    setProjects(p.projects || []);
  };

  const openProject = async (p: Project, preloadedMsgs?: {id:number;text:string;author:string;is_admin:boolean}[]) => {
    setSelectedProject(p);
    setTab('projects');
    setSubTab('messages');
    if (preloadedMsgs) {
      setMessages(preloadedMsgs);
    } else {
      const r = await api.getMessages(p.id);
      setMessages(r.messages || []);
    }
  };

  useEffect(() => {
    openProjectRef.current = openProject;
  });

  const loadSubTab = async (t: 'messages' | 'files' | 'invoices') => {
    if (!selectedProject) return;
    setSubTab(t);
    if (t === 'messages') { const r = await api.getMessages(selectedProject.id); setMessages(r.messages || []); }
    else if (t === 'files') { const r = await api.getFiles(selectedProject.id); setFiles(r.files || []); }
    else if (t === 'invoices') { const r = await api.getInvoices(selectedProject.id); setInvoices(r.invoices || []); }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !selectedProject) return;
    const text = msgText;
    const res = await api.adminSendMessage(selectedProject.id, text);
    setMessages(prev => [...prev, { ...res, is_admin: true, author: 'Команда', text }]);
    setMsgText('');
    api.notifyIfOffline(selectedProject.id, text);
  };

  const updateStatus = async (status: string) => {
    if (!selectedProject) return;
    await api.adminUpdateStatus(selectedProject.id, status);
    setSelectedProject({ ...selectedProject, status });
    setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, status } : p));
    api.notifyStatusChanged(selectedProject.id, status);
  };

  const createUser = async () => {
    await api.adminCreateUser(newUser.name, newUser.email, newUser.password);
    setShowNewUser(false); setNewUser({ name: '', email: '', password: '' });
    loadData();
  };

  const createProject = async () => {
    await api.adminCreateProject(newProject.user_id, newProject.title, newProject.status, newProject.description);
    setShowNewProject(false); setNewProject({ user_id: 0, title: '', status: 'new', description: '' });
    loadData();
  };

  const addFile = async () => {
    if (!selectedProject) return;
    await api.adminAddFile(selectedProject.id, newFile.name, newFile.url, newFile.file_type);
    setShowFileForm(false); setNewFile({ name: '', url: '', file_type: '' });
    const r = await api.getFiles(selectedProject.id); setFiles(r.files || []);
  };

  const addInvoice = async () => {
    if (!selectedProject) return;
    const amount = parseFloat(newInvoice.amount);
    const title = newInvoice.title;
    await api.adminAddInvoice(selectedProject.id, title, amount, newInvoice.file_url);
    setShowInvoiceForm(false); setNewInvoice({ title: '', amount: '', file_url: '' });
    const r = await api.getInvoices(selectedProject.id); setInvoices(r.invoices || []);
    api.notifyInvoice(selectedProject.id, title, amount);
  };

  const logout = async () => {
    await api.logout();
    localStorage.removeItem('session_id');
    navigate('/login');
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-white placeholder-white/30 outline-none text-sm";
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Golos Text, sans-serif' };
  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #a855f7, #00f5ff)' }}>
            <Icon name="Globe" size={15} className="text-white" />
          </div>
          <span className="font-['Oswald'] font-bold tracking-wide">LANDINGGURU — АДМИН</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
          <Icon name="LogOut" size={15} /> Выйти
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['projects', 'users'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={tab === t ? { background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' } : { ...cardStyle, color: 'rgba(255,255,255,0.4)' }}>
              {t === 'projects' ? 'Проекты' : 'Клиенты'}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Oswald'] font-bold text-xl">Клиенты</h2>
              <button onClick={() => setShowNewUser(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                <Icon name="Plus" size={15} /> Добавить клиента
              </button>
            </div>

            {showNewUser && (
              <div className="rounded-2xl p-5 mb-4 space-y-3" style={{ ...cardStyle, border: '1px solid rgba(168,85,247,0.2)' }}>
                <h3 className="font-semibold text-sm text-white/70">Новый клиент</h3>
                <input className={inputCls} style={inputStyle} placeholder="Имя" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                <input className={inputCls} style={inputStyle} placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                <input className={inputCls} style={inputStyle} placeholder="Пароль" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={createUser} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>Создать</button>
                  <button onClick={() => setShowNewUser(false)} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white/60">Отмена</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-xl" style={cardStyle}>
                  <div>
                    <div className="font-semibold text-sm">{u.name}</div>
                    <div className="text-white/40 text-xs">{u.email}</div>
                  </div>
                  <div className="text-white/30 text-xs">ID: {u.id}</div>
                </div>
              ))}
              {users.length === 0 && <p className="text-white/30 text-sm text-center py-8">Клиентов пока нет</p>}
            </div>
          </div>
        )}

        {tab === 'projects' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Projects list */}
            <div className="lg:w-72 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Oswald'] font-bold text-xl">Проекты</h2>
                <button onClick={() => { setShowNewProject(true); loadData(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                  <Icon name="Plus" size={13} /> Новый
                </button>
              </div>

              {showNewProject && (
                <div className="rounded-2xl p-4 mb-3 space-y-2" style={{ ...cardStyle, border: '1px solid rgba(168,85,247,0.2)' }}>
                  <select className={inputCls} style={inputStyle} value={newProject.user_id} onChange={e => setNewProject({ ...newProject, user_id: Number(e.target.value) })}>
                    <option value={0}>Выбрать клиента...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <input className={inputCls} style={inputStyle} placeholder="Название проекта" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} />
                  <select className={inputCls} style={inputStyle} value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value })}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <textarea className={inputCls} style={inputStyle} placeholder="Описание" rows={2} value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={createProject} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>Создать</button>
                    <button onClick={() => setShowNewProject(false)} className="text-xs text-white/40 px-2">Отмена</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {projects.map(p => (
                  <button key={p.id} onClick={() => openProject(p)}
                    className="w-full text-left rounded-xl p-3 transition-all"
                    style={{ ...cardStyle, borderColor: selectedProject?.id === p.id ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)' }}>
                    <div className="font-semibold text-sm mb-1">{p.title}</div>
                    <div className="text-white/40 text-xs mb-2">{p.client_name}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${STATUS_COLORS[p.status] || '#a855f7'}20`, color: STATUS_COLORS[p.status] || '#a855f7' }}>
                      {STATUS_OPTIONS.find(s => s.value === p.status)?.label || p.status}
                    </span>
                  </button>
                ))}
                {projects.length === 0 && <p className="text-white/30 text-sm text-center py-6">Проектов пока нет</p>}
              </div>
            </div>

            {/* Project detail */}
            <div className="flex-1">
              {!selectedProject ? (
                <div className="rounded-2xl p-12 text-center" style={cardStyle}>
                  <Icon name="FolderOpen" size={40} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/30">Выберите проект</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                  <div className="p-5 sm:p-6 flex items-start justify-between gap-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <h1 className="font-['Oswald'] font-bold text-xl">{selectedProject.title}</h1>
                      <p className="text-white/40 text-sm mt-0.5">{selectedProject.client_name}</p>
                    </div>
                    <select value={selectedProject.status} onChange={e => updateStatus(e.target.value)}
                      className="px-3 py-1.5 rounded-xl text-sm font-semibold outline-none"
                      style={{ background: `${STATUS_COLORS[selectedProject.status] || '#a855f7'}20`, color: STATUS_COLORS[selectedProject.status] || '#a855f7', border: `1px solid ${STATUS_COLORS[selectedProject.status] || '#a855f7'}40` }}>
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {(['messages', 'files', 'invoices'] as const).map(t => (
                      <button key={t} onClick={() => loadSubTab(t)}
                        className="flex-1 py-3 text-sm font-medium transition-colors"
                        style={{ color: subTab === t ? '#a855f7' : 'rgba(255,255,255,0.4)', borderBottom: subTab === t ? '2px solid #a855f7' : '2px solid transparent' }}>
                        {t === 'messages' ? 'Переписка' : t === 'files' ? 'Файлы' : 'Счета'}
                      </button>
                    ))}
                  </div>

                  <div className="p-5 sm:p-6">
                    {subTab === 'messages' && (
                      <div>
                        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                          {messages.length === 0 && <p className="text-white/30 text-sm text-center py-4">Сообщений нет</p>}
                          {messages.map((m, i) => (
                            <div key={m.id || i} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                              <div className="max-w-xs sm:max-w-md rounded-2xl px-4 py-3 text-sm"
                                style={m.is_admin
                                  ? { background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }
                                  : { background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.15)' }}>
                                <div className="text-xs mb-1 font-semibold" style={{ color: m.is_admin ? '#a855f7' : '#00f5ff' }}>
                                  {m.is_admin ? 'Команда' : m.author}
                                </div>
                                <p className="text-white/80">{m.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input value={msgText} onChange={e => setMsgText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Ответить клиенту..."
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

                    {subTab === 'files' && (
                      <div>
                        {!showFileForm ? (
                          <button onClick={() => setShowFileForm(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mb-4"
                            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                            <Icon name="Plus" size={14} /> Добавить файл
                          </button>
                        ) : (
                          <div className="space-y-2 mb-4 p-4 rounded-xl" style={cardStyle}>
                            <input className={inputCls} style={inputStyle} placeholder="Название" value={newFile.name} onChange={e => setNewFile({ ...newFile, name: e.target.value })} />
                            <input className={inputCls} style={inputStyle} placeholder="Ссылка (URL)" value={newFile.url} onChange={e => setNewFile({ ...newFile, url: e.target.value })} />
                            <input className={inputCls} style={inputStyle} placeholder="Тип (макет, документ...)" value={newFile.file_type} onChange={e => setNewFile({ ...newFile, file_type: e.target.value })} />
                            <div className="flex gap-2">
                              <button onClick={addFile} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>Добавить</button>
                              <button onClick={() => setShowFileForm(false)} className="text-xs text-white/40 px-2">Отмена</button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          {files.length === 0 && <p className="text-white/30 text-sm text-center py-4">Файлов нет</p>}
                          {files.map(f => (
                            <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                              <Icon name="FileText" size={16} className="text-purple-400 shrink-0" />
                              <span className="text-sm text-white/70 flex-1">{f.name}</span>
                              <Icon name="ExternalLink" size={13} className="text-white/30" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {subTab === 'invoices' && (
                      <div>
                        {!showInvoiceForm ? (
                          <button onClick={() => setShowInvoiceForm(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mb-4"
                            style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                            <Icon name="Plus" size={14} /> Выставить счёт
                          </button>
                        ) : (
                          <div className="space-y-2 mb-4 p-4 rounded-xl" style={cardStyle}>
                            <input className={inputCls} style={inputStyle} placeholder="Название счёта" value={newInvoice.title} onChange={e => setNewInvoice({ ...newInvoice, title: e.target.value })} />
                            <input className={inputCls} style={inputStyle} placeholder="Сумма (₽)" type="number" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })} />
                            <input className={inputCls} style={inputStyle} placeholder="Ссылка на PDF (необязательно)" value={newInvoice.file_url} onChange={e => setNewInvoice({ ...newInvoice, file_url: e.target.value })} />
                            <div className="flex gap-2">
                              <button onClick={addInvoice} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>Добавить</button>
                              <button onClick={() => setShowInvoiceForm(false)} className="text-xs text-white/40 px-2">Отмена</button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          {invoices.length === 0 && <p className="text-white/30 text-sm text-center py-4">Счетов нет</p>}
                          {invoices.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl" style={cardStyle}>
                              <div>
                                <div className="font-semibold text-sm">{inv.title}</div>
                                <div className="text-white/40 text-xs">{inv.status === 'paid' ? '✅ Оплачен' : '⏳ Ожидает'}</div>
                              </div>
                              <span className="font-bold text-purple-400">{inv.amount.toLocaleString()} ₽</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}