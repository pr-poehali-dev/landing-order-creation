import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { setFavicon } from '@/lib/favicon';
import { playNotification } from '@/lib/notification';
import Icon from '@/components/ui/icon';

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
  const [tab, setTab] = useState<'projects' | 'users' | 'chat' | 'sections'>('projects');
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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState({ name: '', email: '', password: '' });
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [chatBlink, setChatBlink] = useState(false);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('sound_off') !== '1');
  const soundOnRef = useRef(soundOn);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);
  const toggleSound = () => setSoundOn(v => { localStorage.setItem('sound_off', v ? '1' : '0'); return !v; });
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdInfo, setPwdInfo] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sections, setSections] = useState<{ key: string; title: string; enabled: boolean }[]>([]);
  const [promos, setPromos] = useState<{ id: number; title: string; description: string; badge: string; old_price: string; new_price: string; active: boolean; sort_order: number }[]>([]);
  const [editingPromo, setEditingPromo] = useState<null | { id?: number; title: string; description: string; badge: string; old_price: string; new_price: string; active: boolean; sort_order: number }>(null);
  const [reviews, setReviews] = useState<{ id: number; name: string; role: string; text: string; rating: number; active: boolean; sort_order: number }[]>([]);
  const [editingReview, setEditingReview] = useState<null | { id?: number; name: string; role: string; text: string; rating: number; active: boolean; sort_order: number }>(null);
  const [portfolio, setPortfolio] = useState<{ id: number; title: string; category: string; image_url: string; color: string; active: boolean; sort_order: number }[]>([]);
  const [editingPortfolio, setEditingPortfolio] = useState<null | { id?: number; title: string; category: string; image_url: string; color: string; active: boolean; sort_order: number }>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const portfolioImgRef = useRef<HTMLInputElement>(null);
  const fileInputAdminRef = useRef<HTMLInputElement>(null);
  const fileInputTabRef = useRef<HTMLInputElement>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMsgCountRef = useRef<Record<number, number>>({});
  const awaitingPayRef = useRef<number[] | null>(null);
  const selectedProjectRef = useRef<Project | null>(null);
  const projectsRef = useRef<Project[]>([]);
  const messagesRef = useRef<{id:number;text:string;author:string;is_admin:boolean}[]>([]);
  const openProjectRef = useRef<((p: Project, msgs?: {id:number;text:string;author:string;is_admin:boolean}[]) => void) | null>(null);
  const subTabRef = useRef<string>('messages');

  useEffect(() => { if (tab === 'sections') loadSections(); }, [tab]);
  useEffect(() => { selectedProjectRef.current = selectedProject; }, [selectedProject]);
  useEffect(() => { subTabRef.current = subTab; }, [subTab]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  useEffect(() => {
    const total = Object.values(unread).reduce((s, n) => s + n, 0);
    const base = 'Админ — LandingGuru';
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
      if (res.error || !res.is_admin) { navigate('/login'); return; }
    });
    loadData();

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const poll = async () => {
      if (document.visibilityState === 'hidden') return;
      const res = await api.adminGetUnread();
      const counts: Record<string, number> = res.counts || {};
      let blink = false;
      const opened = selectedProjectRef.current;
      for (const proj of projectsRef.current) {
        const total = counts[String(proj.id)] ?? 0;
        const prev = lastMsgCountRef.current[proj.id] ?? total;
        if (total > prev) {
          blink = true;
          if (opened?.id === proj.id && subTabRef.current === 'messages') {
            const r = await api.getMessages(proj.id);
            setMessages(r.messages || []);
          } else {
            setUnread(u => ({ ...u, [proj.id]: (u[proj.id] || 0) + (total - prev) }));
            if (Notification.permission === 'granted') {
              const notif = new Notification(`💬 ${proj.client_name} — ${proj.title}`, {
                body: 'Новое сообщение',
                icon: '/favicon.ico',
              });
              notif.onclick = () => { window.focus(); openProjectRef.current?.(proj); };
            }
          }
        }
        lastMsgCountRef.current[proj.id] = total;
      }
      // Новые заявки об оплате (клиент нажал «Я оплатил»)
      const awaiting: number[] = res.awaiting_payments || [];
      if (awaitingPayRef.current !== null) {
        const fresh = awaiting.filter(id => !awaitingPayRef.current!.includes(id));
        if (fresh.length > 0) {
          blink = true;
          if (opened) { const r = await api.getInvoices(opened.id); setInvoices(r.invoices || []); }
          if (Notification.permission === 'granted') {
            new Notification('💰 Клиент сообщил об оплате', {
              body: 'Подтвердите поступление денег во вкладке «Счета»',
              icon: '/favicon.ico',
            });
          }
        }
      }
      awaitingPayRef.current = awaiting;
      if (blink) {
        if (soundOnRef.current) playNotification();
        setChatBlink(false);
        requestAnimationFrame(() => setChatBlink(true));
        if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
        blinkTimeoutRef.current = setTimeout(() => setChatBlink(false), 1500);
      }
      // Проверяем typing только для открытого проекта
      if (opened && subTabRef.current === 'messages') {
        const t = await api.adminGetTyping(opened.id);
        setPeerTyping(t.is_typing || false);
      }
    };

    const interval = setInterval(poll, 10000);
    const onVisible = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [navigate]);

  const loadData = async () => {
    const [u, p] = await Promise.all([api.adminGetUsers(), api.adminGetProjects()]);
    setUsers(u.users || []);
    const projs: Project[] = p.projects || [];
    setProjects(projs);
    // Инициализируем baseline счётчиков одним запросом
    const res = await api.adminGetUnread();
    const counts: Record<string, number> = res.counts || {};
    for (const proj of projs) {
      if (lastMsgCountRef.current[proj.id] === undefined) {
        lastMsgCountRef.current[proj.id] = counts[String(proj.id)] ?? 0;
      }
    }
  };

  const openProject = async (p: Project, preloadedMsgs?: {id:number;text:string;author:string;is_admin:boolean}[]) => {
    setSelectedProject(p);
    setTab('projects');
    setSubTab('messages');
    setUnread(prev => ({ ...prev, [p.id]: 0 }));
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
    if (t === 'messages') {
      setUnread(prev => ({ ...prev, [selectedProject.id]: 0 }));
      const r = await api.getMessages(selectedProject.id); setMessages(r.messages || []);
    }
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

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;
    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await api.adminUploadFile(selectedProject.id, file.name, base64);
      if (res.url) {
        const text = res.file_type === 'image' ? `[img:${res.url}]` : `[file:${res.url}:${res.name}]`;
        const msgRes = await api.adminSendMessage(selectedProject.id, text);
        setMessages(prev => [...prev, { ...msgRes, is_admin: true, author: 'Команда', text }]);
        api.notifyIfOffline(selectedProject.id, `📎 Файл: ${res.name}`);
      }
      setUploadingFile(false);
      if (fileInputAdminRef.current) fileInputAdminRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const updateStatus = async (status: string) => {
    if (!selectedProject) return;
    await api.adminUpdateStatus(selectedProject.id, status);
    setSelectedProject({ ...selectedProject, status });
    setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, status } : p));
    api.notifyStatusChanged(selectedProject.id, status);
  };

  const createUser = async () => {
    const res = await api.adminCreateUser(newUser.name, newUser.email, newUser.password);
    setShowNewUser(false);
    setNewUser({ name: '', email: '', password: '' });
    await loadData();
    if (res.id) {
      setTab('projects');
      setShowNewProject(true);
      setNewProject({ user_id: res.id, title: '', status: 'new', description: '' });
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Удалить клиента? Все его проекты и данные будут удалены.')) return;
    await api.adminDeleteUser(id);
    loadData();
  };

  const loadSections = async () => {
    const [s, p, rv, pf] = await Promise.all([api.adminGetSections(), api.adminGetPromos(), api.adminGetReviews(), api.adminGetPortfolio()]);
    if (s.sections) setSections(s.sections);
    if (p.promos) setPromos(p.promos);
    if (rv.reviews) setReviews(rv.reviews);
    if (pf.portfolio) setPortfolio(pf.portfolio);
  };

  const toggleSection = async (key: string, enabled: boolean) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, enabled } : s));
    await api.adminToggleSection(key, enabled);
  };

  const emptyPromo = { title: '', description: '', badge: '', old_price: '', new_price: '', active: true, sort_order: 0 };

  const savePromo = async () => {
    if (!editingPromo || !editingPromo.title.trim()) return;
    await api.adminSavePromo(editingPromo);
    setEditingPromo(null);
    loadSections();
  };

  const deletePromo = async (id: number) => {
    if (!confirm('Удалить акцию?')) return;
    await api.adminDeletePromo(id);
    loadSections();
  };

  const emptyReview = { name: '', role: '', text: '', rating: 5, active: true, sort_order: 0 };

  const saveReview = async () => {
    if (!editingReview || !editingReview.name.trim()) return;
    await api.adminSaveReview(editingReview);
    setEditingReview(null);
    loadSections();
  };

  const deleteReview = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return;
    await api.adminDeleteReview(id);
    loadSections();
  };

  const emptyPortfolio = { title: '', category: '', image_url: '', color: '#a855f7', active: true, sort_order: 0 };

  const uploadPortfolioImage = async (file: File) => {
    if (!editingPortfolio) return;
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = String(reader.result).split(',')[1];
      const res = await api.adminUploadImage(file.name, b64);
      if (res.url) setEditingPortfolio(prev => prev ? { ...prev, image_url: res.url } : prev);
      setUploadingImage(false);
    };
    reader.onerror = () => setUploadingImage(false);
    reader.readAsDataURL(file);
  };

  const savePortfolio = async () => {
    if (!editingPortfolio || !editingPortfolio.title.trim()) return;
    await api.adminSavePortfolio(editingPortfolio);
    setEditingPortfolio(null);
    loadSections();
  };

  const deletePortfolio = async (id: number) => {
    if (!confirm('Удалить работу?')) return;
    await api.adminDeletePortfolio(id);
    loadSections();
  };

  const startEditUser = (u: User) => {
    setEditingUser(u);
    setEditUser({ name: u.name, email: u.email, password: '' });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    await api.adminUpdateUser(editingUser.id, editUser.name, editUser.email, editUser.password);
    setEditingUser(null);
    loadData();
  };

  const createProject = async () => {
    if (!newProject.user_id) { alert('Выберите клиента для проекта'); return; }
    if (!newProject.title.trim()) { alert('Введите название проекта'); return; }
    const res = await api.adminCreateProject(newProject.user_id, newProject.title.trim(), newProject.status, newProject.description);
    if (res?.error) { alert(res.error); return; }
    setShowNewProject(false); setNewProject({ user_id: 0, title: '', status: 'new', description: '' });
    loadData();
  };

  const addFile = async () => {
    if (!selectedProject) return;
    await api.adminAddFile(selectedProject.id, newFile.name, newFile.url, newFile.file_type);
    setShowFileForm(false); setNewFile({ name: '', url: '', file_type: '' });
    const r = await api.getFiles(selectedProject.id); setFiles(r.files || []);
  };

  const deleteFile = async (fileId: number) => {
    await api.adminDeleteFile(fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleTabFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;
    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await api.adminUploadFile(selectedProject.id, file.name, base64);
      if (res.url) setFiles(prev => [...prev, { id: res.id, name: res.name, url: res.url, file_type: res.file_type }]);
      setUploadingFile(false);
      if (fileInputTabRef.current) fileInputTabRef.current.value = '';
    };
    reader.readAsDataURL(file);
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

  const confirmPayment = async (invoiceId: number) => {
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: 'paid' } : i));
    await api.adminConfirmPayment(invoiceId);
    if (selectedProject) { const r = await api.getInvoices(selectedProject.id); setInvoices(r.invoices || []); }
  };

  const deleteInvoice = async (invoiceId: number) => {
    if (!confirm('Отменить счёт? Он будет удалён у клиента.')) return;
    setInvoices(prev => prev.filter(i => i.id !== invoiceId));
    await api.adminDeleteInvoice(invoiceId);
    if (selectedProject) { const r = await api.getInvoices(selectedProject.id); setInvoices(r.invoices || []); }
  };

  const logout = async () => {
    await api.logout();
    localStorage.removeItem('session_id');
    navigate('/login');
  };

  const changePassword = async () => {
    setPwdError(''); setPwdInfo('');
    if (!pwdForm.current || !pwdForm.next) { setPwdError('Заполните все поля'); return; }
    if (pwdForm.next.length < 6) { setPwdError('Новый пароль не короче 6 символов'); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('Пароли не совпадают'); return; }
    const res = await api.adminChangePassword(pwdForm.current, pwdForm.next);
    if (res?.error) { setPwdError(res.error); return; }
    setPwdInfo('Пароль изменён');
    setPwdForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setShowChangePwd(false), 1200);
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
        <div className="flex items-center gap-4">
          <button onClick={toggleSound} title={soundOn ? 'Звук включён' : 'Звук выключен'}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
            <Icon name={soundOn ? 'Volume2' : 'VolumeX'} size={16} />
          </button>
          <button onClick={() => { setPwdError(''); setPwdInfo(''); setPwdForm({ current: '', next: '', confirm: '' }); setShowChangePwd(true); }}
            title="Сменить пароль"
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
            <Icon name="KeyRound" size={15} />
          </button>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
            <Icon name="LogOut" size={15} /> Выйти
          </button>
        </div>
      </header>

      {showChangePwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowChangePwd(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#12121c', border: '1px solid rgba(168,85,247,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Oswald'] font-bold text-lg">Смена пароля</h3>
              <button onClick={() => setShowChangePwd(false)} className="text-white/40 hover:text-white/80">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <input type="password" className={inputCls} style={inputStyle} placeholder="Текущий пароль"
                value={pwdForm.current} onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })} />
              <input type="password" className={inputCls} style={inputStyle} placeholder="Новый пароль"
                value={pwdForm.next} onChange={e => setPwdForm({ ...pwdForm, next: e.target.value })} />
              <input type="password" className={inputCls} style={inputStyle} placeholder="Повторите новый пароль"
                value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
              {pwdError && <p className="text-red-400 text-sm">{pwdError}</p>}
              {pwdInfo && <p className="text-emerald-400 text-sm">{pwdInfo}</p>}
              <button onClick={changePassword}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-1"
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <style>{`@keyframes chatBlink{0%,100%{background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4);border-color:rgba(255,255,255,0.08)}50%{background:rgba(74,222,128,0.25);color:#4ade80;border-color:rgba(74,222,128,0.5)}}.chat-blink{animation:chatBlink 0.5s ease-in-out 3}`}</style>
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['projects', 'users', 'chat', 'sections'] as const).map(t => {
            const totalUnread = Object.values(unread).reduce((s, n) => s + n, 0);
            return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${t === 'chat' && chatBlink && tab !== 'chat' ? 'chat-blink' : ''}`}
              style={tab === t ? { background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' } : { ...cardStyle, color: 'rgba(255,255,255,0.4)' }}>
              {t === 'projects' ? 'Проекты' : t === 'users' ? 'Клиенты' : t === 'chat' ? 'Чат' : 'Разделы сайта'}
              {t === 'chat' && totalUnread > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none" style={{ background: '#a855f7', color: 'white' }}>{totalUnread}</span>
              )}
            </button>
            );
          })}
        </div>

        {tab === 'sections' && (
          <div className="space-y-8">
            <div>
              <h2 className="font-['Oswald'] font-bold text-xl mb-1">Разделы сайта</h2>
              <p className="text-white/40 text-sm mb-4">Включайте и выключайте блоки на главной странице</p>
              <div className="space-y-2">
                {sections.map(s => (
                  <div key={s.key} className="flex items-center justify-between p-4 rounded-xl" style={cardStyle}>
                    <div>
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-white/40 text-xs">{s.enabled ? 'Показывается на сайте' : 'Скрыт'}</div>
                    </div>
                    <button onClick={() => toggleSection(s.key, !s.enabled)}
                      className="relative w-12 h-6 rounded-full transition-colors"
                      style={{ background: s.enabled ? '#a855f7' : 'rgba(255,255,255,0.15)' }}>
                      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: s.enabled ? '26px' : '2px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Oswald'] font-bold text-xl">Акции</h2>
                <button onClick={() => setEditingPromo({ ...emptyPromo })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                  <Icon name="Plus" size={15} /> Добавить акцию
                </button>
              </div>
              {promos.length === 0 && <p className="text-white/40 text-sm">Пока нет ни одной акции. Добавьте первую.</p>}
              <div className="space-y-2">
                {promos.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-4 rounded-xl" style={cardStyle}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>{p.badge}</span>}
                        <span className="font-semibold truncate">{p.title}</span>
                        {!p.active && <span className="text-xs text-white/30">(скрыта)</span>}
                      </div>
                      {p.description && <div className="text-white/40 text-xs mt-1 line-clamp-2">{p.description}</div>}
                      {(p.old_price || p.new_price) && (
                        <div className="text-xs mt-1">
                          {p.old_price && <span className="text-white/30 line-through mr-2">{p.old_price}</span>}
                          {p.new_price && <span className="text-white font-semibold">{p.new_price}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingPromo({ id: p.id, title: p.title, description: p.description, badge: p.badge, old_price: p.old_price, new_price: p.new_price, active: p.active, sort_order: p.sort_order })}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"><Icon name="Pencil" size={16} /></button>
                      <button onClick={() => deletePromo(p.id)}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-red-400 transition-colors"><Icon name="Trash2" size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Oswald'] font-bold text-xl">Отзывы</h2>
                <button onClick={() => setEditingReview({ ...emptyReview })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                  <Icon name="Plus" size={15} /> Добавить отзыв
                </button>
              </div>
              {reviews.length === 0 && <p className="text-white/40 text-sm">Пока нет ни одного отзыва. Добавьте первый.</p>}
              <div className="space-y-2">
                {reviews.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-4 rounded-xl" style={cardStyle}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{r.name}</span>
                        <span className="text-yellow-400 text-xs">{'★'.repeat(r.rating)}</span>
                        {!r.active && <span className="text-xs text-white/30">(скрыт)</span>}
                      </div>
                      {r.role && <div className="text-white/40 text-xs">{r.role}</div>}
                      {r.text && <div className="text-white/40 text-xs mt-1 line-clamp-2">{r.text}</div>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingReview({ id: r.id, name: r.name, role: r.role, text: r.text, rating: r.rating, active: r.active, sort_order: r.sort_order })}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"><Icon name="Pencil" size={16} /></button>
                      <button onClick={() => deleteReview(r.id)}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-red-400 transition-colors"><Icon name="Trash2" size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Oswald'] font-bold text-xl">Портфолио</h2>
                <button onClick={() => setEditingPortfolio({ ...emptyPortfolio })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
                  <Icon name="Plus" size={15} /> Добавить работу
                </button>
              </div>
              {portfolio.length === 0 && <p className="text-white/40 text-sm">Пока нет ни одной работы. Добавьте первую.</p>}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {portfolio.map(w => (
                  <div key={w.id} className="rounded-xl overflow-hidden" style={cardStyle}>
                    <div className="aspect-[4/3] bg-white/5 relative">
                      {w.image_url && <img src={w.image_url} alt={w.title} className="w-full h-full object-cover" />}
                      {!w.active && <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full bg-black/60 text-white/70">скрыта</span>}
                    </div>
                    <div className="p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs" style={{ color: w.color }}>{w.category}</div>
                        <div className="font-semibold text-sm truncate">{w.title}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditingPortfolio({ id: w.id, title: w.title, category: w.category, image_url: w.image_url, color: w.color, active: w.active, sort_order: w.sort_order })}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"><Icon name="Pencil" size={15} /></button>
                        <button onClick={() => deletePortfolio(w.id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-red-400 transition-colors"><Icon name="Trash2" size={15} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {editingPortfolio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setEditingPortfolio(null)}>
            <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#12121c', border: '1px solid rgba(168,85,247,0.3)' }} onClick={e => e.stopPropagation()}>
              <h3 className="font-['Oswald'] font-bold text-xl mb-4">{editingPortfolio.id ? 'Редактировать работу' : 'Новая работа'}</h3>
              <div className="space-y-3">
                <div onClick={() => portfolioImgRef.current?.click()}
                  className="aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer relative"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                  {editingPortfolio.image_url
                    ? <img src={editingPortfolio.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="text-center text-white/40 text-sm"><Icon name="ImagePlus" size={28} className="mx-auto mb-1" />Загрузить картинку</div>}
                  {uploadingImage && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">Загрузка…</div>}
                </div>
                <input ref={portfolioImgRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadPortfolioImage(f); e.target.value = ''; }} />
                <input value={editingPortfolio.title} onChange={e => setEditingPortfolio({ ...editingPortfolio, title: e.target.value })} placeholder="Название работы *" className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <input value={editingPortfolio.category} onChange={e => setEditingPortfolio({ ...editingPortfolio, category: e.target.value })} placeholder="Категория (напр. Авто, Красота)" className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <div className="flex items-center gap-3">
                  <label className="text-sm text-white/60">Цвет:</label>
                  <input type="color" value={editingPortfolio.color} onChange={e => setEditingPortfolio({ ...editingPortfolio, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent" />
                  <input type="number" value={editingPortfolio.sort_order} onChange={e => setEditingPortfolio({ ...editingPortfolio, sort_order: Number(e.target.value) })} placeholder="Порядок" className="w-24 px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                </div>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" checked={editingPortfolio.active} onChange={e => setEditingPortfolio({ ...editingPortfolio, active: e.target.checked })} />
                  Показывать на сайте
                </label>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setEditingPortfolio(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/60" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>Отмена</button>
                <button onClick={savePortfolio} disabled={uploadingImage} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>Сохранить</button>
              </div>
            </div>
          </div>
        )}

        {editingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setEditingReview(null)}>
            <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#12121c', border: '1px solid rgba(168,85,247,0.3)' }} onClick={e => e.stopPropagation()}>
              <h3 className="font-['Oswald'] font-bold text-xl mb-4">{editingReview.id ? 'Редактировать отзыв' : 'Новый отзыв'}</h3>
              <div className="space-y-3">
                <input value={editingReview.name} onChange={e => setEditingReview({ ...editingReview, name: e.target.value })} placeholder="Имя клиента *" className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <input value={editingReview.role} onChange={e => setEditingReview({ ...editingReview, role: e.target.value })} placeholder="Должность / компания" className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <textarea value={editingReview.text} onChange={e => setEditingReview({ ...editingReview, text: e.target.value })} placeholder="Текст отзыва" rows={4} className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <div className="flex items-center gap-3">
                  <label className="text-sm text-white/60">Оценка:</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setEditingReview({ ...editingReview, rating: n })}
                        className="text-2xl leading-none transition-colors" style={{ color: n <= editingReview.rating ? '#facc15' : 'rgba(255,255,255,0.15)' }}>★</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" value={editingReview.sort_order} onChange={e => setEditingReview({ ...editingReview, sort_order: Number(e.target.value) })} placeholder="Порядок" className="w-24 px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                    <input type="checkbox" checked={editingReview.active} onChange={e => setEditingReview({ ...editingReview, active: e.target.checked })} />
                    Показывать на сайте
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setEditingReview(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/60" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>Отмена</button>
                <button onClick={saveReview} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>Сохранить</button>
              </div>
            </div>
          </div>
        )}

        {editingPromo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setEditingPromo(null)}>
            <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#12121c', border: '1px solid rgba(168,85,247,0.3)' }} onClick={e => e.stopPropagation()}>
              <h3 className="font-['Oswald'] font-bold text-xl mb-4">{editingPromo.id ? 'Редактировать акцию' : 'Новая акция'}</h3>
              <div className="space-y-3">
                <input value={editingPromo.title} onChange={e => setEditingPromo({ ...editingPromo, title: e.target.value })} placeholder="Заголовок акции *" className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <textarea value={editingPromo.description} onChange={e => setEditingPromo({ ...editingPromo, description: e.target.value })} placeholder="Описание" rows={3} className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <input value={editingPromo.badge} onChange={e => setEditingPromo({ ...editingPromo, badge: e.target.value })} placeholder="Плашка (напр. -30% или Хит)" className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                <div className="grid grid-cols-2 gap-3">
                  <input value={editingPromo.old_price} onChange={e => setEditingPromo({ ...editingPromo, old_price: e.target.value })} placeholder="Старая цена" className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <input value={editingPromo.new_price} onChange={e => setEditingPromo({ ...editingPromo, new_price: e.target.value })} placeholder="Новая цена" className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" value={editingPromo.sort_order} onChange={e => setEditingPromo({ ...editingPromo, sort_order: Number(e.target.value) })} placeholder="Порядок" className="w-24 px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                    <input type="checkbox" checked={editingPromo.active} onChange={e => setEditingPromo({ ...editingPromo, active: e.target.checked })} />
                    Показывать на сайте
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setEditingPromo(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/60" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>Отмена</button>
                <button onClick={savePromo} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>Сохранить</button>
              </div>
            </div>
          </div>
        )}

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
                <div key={u.id} className="rounded-xl" style={cardStyle}>
                  {editingUser?.id === u.id ? (
                    <div className="p-4 space-y-2">
                      <input className={inputCls} style={inputStyle} placeholder="Имя" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
                      <input className={inputCls} style={inputStyle} placeholder="Email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
                      <input className={inputCls} style={inputStyle} placeholder="Новый пароль (необязательно)" type="password" value={editUser.password} onChange={e => setEditUser({ ...editUser, password: e.target.value })} />
                      <div className="flex gap-2">
                        <button onClick={saveEditUser} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>Сохранить</button>
                        <button onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white/60">Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <div className="font-semibold text-sm">{u.name}</div>
                        <div className="text-white/40 text-xs">{u.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/20 text-xs mr-2">ID: {u.id}</span>
                        <button onClick={() => startEditUser(u)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors">
                          <Icon name="Pencil" size={14} />
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  )}
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
                  {users.length === 0 ? (
                    <p className="text-xs text-yellow-400/90 py-1">Сначала добавьте клиента во вкладке «Клиенты»</p>
                  ) : (
                    <select className={inputCls} style={inputStyle} value={newProject.user_id} onChange={e => setNewProject({ ...newProject, user_id: Number(e.target.value) })}>
                      <option value={0}>Выбрать клиента...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  )}
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
                {projects.map(p => {
                  const hasUnread = (unread[p.id] || 0) > 0;
                  return (
                    <button key={p.id} onClick={() => openProject(p)}
                      className="w-full text-left rounded-xl p-3 transition-all"
                      style={{
                        ...cardStyle,
                        borderColor: selectedProject?.id === p.id ? 'rgba(168,85,247,0.5)' : hasUnread ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.08)',
                        background: hasUnread ? 'rgba(168,85,247,0.07)' : cardStyle.background,
                      }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm">{p.title}</div>
                        {hasUnread && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#a855f7', color: 'white', minWidth: 20, textAlign: 'center' }}>
                            {unread[p.id]}
                          </span>
                        )}
                      </div>
                      <div className="text-white/40 text-xs mb-2">{p.client_name}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${STATUS_COLORS[p.status] || '#a855f7'}20`, color: STATUS_COLORS[p.status] || '#a855f7' }}>
                        {STATUS_OPTIONS.find(s => s.value === p.status)?.label || p.status}
                      </span>
                    </button>
                  );
                })}
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
                    {(['messages', 'files', 'invoices'] as const).map(t => {
                      const tabUnread = t === 'messages' && subTab !== 'messages' && (unread[selectedProject.id] || 0) > 0;
                      return (
                        <button key={t} onClick={() => loadSubTab(t)}
                          className="flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                          style={{ color: subTab === t ? '#a855f7' : 'rgba(255,255,255,0.4)', borderBottom: subTab === t ? '2px solid #a855f7' : '2px solid transparent' }}>
                          {t === 'messages' ? 'Чат' : t === 'files' ? 'Файлы' : 'Счета'}
                          {tabUnread && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
                              style={{ background: '#a855f7', color: 'white' }}>
                              {unread[selectedProject.id]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-5 sm:p-6">
                    {subTab === 'messages' && (
                      <div>
                        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto" ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
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
                            Клиент печатает...
                          </div>
                        )}
                        <input ref={fileInputAdminRef} type="file" className="hidden" onChange={handleAdminFileUpload} />
                        <div className="flex gap-2">
                          <button onClick={() => fileInputAdminRef.current?.click()} disabled={uploadingFile}
                            className="px-3 py-3 rounded-xl transition-opacity hover:opacity-80"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Icon name={uploadingFile ? 'Loader' : 'Paperclip'} size={16} className="text-white/50" />
                          </button>
                          <input value={msgText} onChange={e => {
                              setMsgText(e.target.value);
                              if (selectedProject) {
                                api.adminSendTyping(selectedProject.id);
                                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                              }
                            }}
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
                        <input ref={fileInputTabRef} type="file" className="hidden" onChange={handleTabFileUpload} />
                        {!showFileForm ? (
                          <div className="flex gap-2 mb-4">
                            <button onClick={() => setShowFileForm(true)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                              style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                              <Icon name="Plus" size={14} /> Добавить файл
                            </button>
                            <button onClick={() => fileInputTabRef.current?.click()} disabled={uploadingFile}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <Icon name={uploadingFile ? 'Loader' : 'Paperclip'} size={14} />
                              {uploadingFile ? 'Загрузка...' : 'Загрузить файл'}
                            </button>
                          </div>
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
                            <div key={f.id} className="flex items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                              <Icon name="FileText" size={16} className="text-purple-400 shrink-0" />
                              <a href={f.url} target="_blank" rel="noreferrer" className="text-sm text-white/70 hover:text-white flex-1 truncate">{f.name}</a>
                              <a href={f.url} target="_blank" rel="noreferrer">
                                <Icon name="ExternalLink" size={13} className="text-white/30 hover:text-white/60" />
                              </a>
                              <button onClick={() => deleteFile(f.id)} className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                <Icon name="Trash2" size={14} />
                              </button>
                            </div>
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
                            <div key={inv.id} className="p-3 rounded-xl" style={cardStyle}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-sm">{inv.title}</div>
                                  <div className="text-xs mt-0.5"
                                    style={{ color: inv.status === 'paid' ? '#4ade80' : inv.status === 'awaiting' ? '#facc15' : 'rgba(255,255,255,0.4)' }}>
                                    {inv.status === 'paid' ? '✅ Оплата получена' : inv.status === 'awaiting' ? '⌛ Клиент оплатил — подтвердите' : '⏳ Ожидает оплаты'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-purple-400">{inv.amount.toLocaleString()} ₽</span>
                                  {inv.status !== 'paid' && (
                                    <button onClick={() => deleteInvoice(inv.id)} title="Отменить счёт"
                                      className="text-white/30 hover:text-red-400 transition-colors">
                                      <Icon name="Trash2" size={15} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {inv.status === 'awaiting' && (
                                <button onClick={() => confirmPayment(inv.id)}
                                  className="mt-2.5 w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                  style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }}>
                                  Подтвердить поступление
                                </button>
                              )}
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

        {tab === 'chat' && (
          <div className="max-w-2xl">
            <h2 className="font-['Oswald'] font-bold text-xl mb-4">Чат</h2>
            {projects.length === 0 ? (
              <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3" style={{ ...cardStyle, minHeight: 240 }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
                  <Icon name="MessagesSquare" size={26} style={{ color: '#a855f7' }} />
                </div>
                <p className="text-white/60 text-sm max-w-xs">Пока нет проектов для переписки.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...projects].sort((a, b) => (unread[b.id] || 0) - (unread[a.id] || 0)).map(p => (
                  <button key={p.id} onClick={() => openProject(p)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-colors hover:bg-white/[0.03]"
                    style={cardStyle}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
                      <Icon name="MessageCircle" size={18} style={{ color: '#a855f7' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{p.title}</div>
                      <div className="text-white/40 text-xs truncate">{p.client_name}</div>
                    </div>
                    {(unread[p.id] || 0) > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full leading-none shrink-0"
                        style={{ background: '#a855f7', color: 'white' }}>
                        {unread[p.id]}
                      </span>
                    )}
                    <Icon name="ChevronRight" size={16} className="text-white/30 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}