import { useEffect, useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { CHECKLIST, CHECKLIST_TOTAL } from "@/data/checklist";

type Answer = { status: string; note: string };
type Answers = Record<string, Answer>;

const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" };

export default function ProjectChecklist({
  projectId,
  load,
  save,
  onUpload,
  onComplete,
}: {
  projectId: number;
  load: (projectId: number) => Promise<{ checklist?: Answers }>;
  save: (projectId: number, itemKey: string, status: string, note: string) => Promise<unknown>;
  onUpload?: (file: File, itemTitle: string) => Promise<void>;
  onComplete?: () => void;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadedKeys, setUploadedKeys] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const completedRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    load(projectId)
      .then(d => { setAnswers(d.checklist || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId, load]);

  const get = (key: string): Answer => answers[key] || { status: "none", note: "" };

  const persist = (key: string, next: Answer) => {
    setSavingKey(key);
    save(projectId, key, next.status, next.note).finally(() => setSavingKey(null));
  };

  const setStatus = (key: string, status: string) => {
    const cur = get(key);
    const next = { ...cur, status: cur.status === status ? "none" : status };
    setAnswers(a => ({ ...a, [key]: next }));
    persist(key, next);
  };

  const setNote = (key: string, note: string) => {
    const next = { ...get(key), note };
    setAnswers(a => ({ ...a, [key]: next }));
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => persist(key, next), 700);
  };

  const handleUpload = async (key: string, itemTitle: string, file: File) => {
    if (!onUpload) return;
    setUploadingKey(key);
    try {
      await onUpload(file, itemTitle);
      setUploadedKeys(prev => ({ ...prev, [key]: file.name }));
    } finally {
      setUploadingKey(null);
    }
  };

  const filled = CHECKLIST.reduce((sum, g) => sum + g.items.filter(i => {
    const a = answers[i.key];
    if (!a) return false;
    return i.type === "yesno" ? a.status !== "none" : (a.note || "").trim().length > 0;
  }).length, 0);
  const percent = Math.round((filled / CHECKLIST_TOTAL) * 100);

  useEffect(() => {
    if (loading) return;
    if (filled === CHECKLIST_TOTAL && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
    if (filled < CHECKLIST_TOTAL) completedRef.current = false;
  }, [filled, loading, onComplete]);

  if (loading) return <p className="text-white/40 text-sm">Загрузка чек-листа…</p>;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl" style={cardStyle}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Готовность брифа</span>
          <span className="text-sm font-bold" style={{ color: percent === 100 ? "#4ade80" : "#a855f7" }}>
            {filled} из {CHECKLIST_TOTAL} · {percent}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%`, background: percent === 100 ? "#4ade80" : "linear-gradient(90deg, #a855f7, #00f5ff)" }} />
        </div>
        <p className="text-white/40 text-xs mt-2">Ответы сохраняются автоматически</p>
      </div>

      {CHECKLIST.map(group => (
        <div key={group.title}>
          <div className="flex items-center gap-2 mb-3">
            <Icon name={group.icon} size={17} className="text-purple-400" />
            <h3 className="font-['Oswald'] font-bold text-lg">{group.title}</h3>
          </div>
          <div className="space-y-2">
            {group.items.map(item => {
              const a = get(item.key);
              const done = item.type === "yesno" ? a.status !== "none" : (a.note || "").trim().length > 0;
              return (
                <div key={item.key} className="p-4 rounded-xl" style={cardStyle}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon name={done ? "CircleCheck" : "Circle"} size={16}
                          className={done ? "text-emerald-400 shrink-0" : "text-white/20 shrink-0"} />
                        <span className="font-semibold text-sm">{item.title}</span>
                      </div>
                      <p className="text-white/35 text-xs mt-1 ml-6">{item.hint}</p>
                    </div>
                    {savingKey === item.key && <span className="text-white/30 text-xs shrink-0">сохранение…</span>}
                  </div>

                  <div className="ml-6 mt-3 space-y-2">
                    {item.type === "yesno" && (
                      <div className="flex gap-2">
                        {[
                          { v: "yes", label: "Да, есть", color: "#4ade80" },
                          { v: "no", label: "Нет", color: "#fb7185" },
                          { v: "progress", label: "В процессе", color: "#facc15" },
                        ].map(opt => (
                          <button key={opt.v} onClick={() => setStatus(item.key, opt.v)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={a.status === opt.v
                              ? { background: `${opt.color}22`, color: opt.color, border: `1px solid ${opt.color}55` }
                              : { ...cardStyle, color: "rgba(255,255,255,0.4)" }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={a.note}
                      onChange={e => setNote(item.key, e.target.value)}
                      rows={item.type === "text" ? 2 : 1}
                      placeholder={item.type === "yesno" ? "Комментарий (по желанию)" : "Ваш ответ"}
                      className="w-full px-3 py-2 rounded-lg text-white placeholder-white/25 outline-none text-sm resize-y"
                      style={inputStyle} />

                    {item.upload && onUpload && (
                      <div className="p-3 rounded-lg" style={{ background: "rgba(0,245,255,0.05)", border: "1px dashed rgba(0,245,255,0.25)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="Upload" size={14} style={{ color: "#00f5ff" }} />
                          <span className="text-xs" style={{ color: "rgba(0,245,255,0.85)" }}>{item.upload}</span>
                        </div>
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
                          style={{ background: "rgba(0,245,255,0.12)", color: "#00f5ff", border: "1px solid rgba(0,245,255,0.3)" }}>
                          <Icon name={uploadingKey === item.key ? "Loader" : "Paperclip"} size={13} />
                          {uploadingKey === item.key ? "Загрузка…" : "Выбрать файл"}
                          <input type="file" className="hidden" disabled={uploadingKey === item.key}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(item.key, item.title, f); e.target.value = ""; }} />
                        </label>
                        {uploadedKeys[item.key] && (
                          <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                            <Icon name="Check" size={12} /> Загружено: {uploadedKeys[item.key]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}