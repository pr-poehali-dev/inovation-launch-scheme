import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Trash2, Upload, Link, BookOpen, Briefcase, Heart, Users, AlertCircle, Dumbbell } from "lucide-react"
import Icon from "@/components/ui/icon"

const SCHEDULE_URL = "https://functions.poehali.dev/afbe3ff0-d6e8-45b1-8c3b-5baefbfc00f2"

const SESSION_ID = (() => {
  let id = localStorage.getItem("balance_session")
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("balance_session", id) }
  return id
})()

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

const EVENT_TYPES: Record<string, { label: string; icon: typeof BookOpen; color: string; bg: string }> = {
  study:    { label: "Учёба",    icon: BookOpen,      color: "text-blue-700",   bg: "bg-blue-100" },
  work:     { label: "Работа",   icon: Briefcase,     color: "text-amber-700",  bg: "bg-amber-100" },
  deadline: { label: "Дедлайн",  icon: AlertCircle,   color: "text-red-700",    bg: "bg-red-100" },
  sport:    { label: "Спорт",    icon: Dumbbell,      color: "text-green-700",  bg: "bg-green-100" },
  rest:     { label: "Отдых",    icon: Heart,         color: "text-pink-700",   bg: "bg-pink-100" },
  social:   { label: "Соцжизнь", icon: Users,         color: "text-purple-700", bg: "bg-purple-100" },
}

interface ScheduleEvent {
  id: string
  title: string
  event_type: string
  day_of_week: number
  start_time: string
  end_time: string
  description: string
  source: string
}

interface Props {
  onBack: () => void
  theme: {
    bg: string; cardBg: string; text: string; textSecondary: string
    border: string; buttonBg: string; buttonText: string
  }
}

export default function Schedule({ onBack, theme }: Props) {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"week" | "add" | "import">("week")
  const [form, setForm] = useState({ title: "", event_type: "study", day_of_week: 1, start_time: "09:00", end_time: "10:30", description: "" })
  const [urlInput, setUrlInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [importMsg, setImportMsg] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const headers = { "Content-Type": "application/json", "X-Session-Id": SESSION_ID }

  useEffect(() => {
    fetch(SCHEDULE_URL, { headers })
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
      .finally(() => setLoading(false))
  }, [])

  const addEvent = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const res = await fetch(SCHEDULE_URL, { method: "POST", headers, body: JSON.stringify({ ...form, source: "manual" }) })
    const data = await res.json()
    if (data.id) {
      setEvents(prev => [...prev, { ...form, id: data.id, source: "manual" }])
      setForm({ title: "", event_type: "study", day_of_week: 1, start_time: "09:00", end_time: "10:30", description: "" })
      setTab("week")
    }
    setSaving(false)
  }

  const deleteEvent = async (id: string) => {
    await fetch(`${SCHEDULE_URL}?id=${id}`, { method: "DELETE", headers })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter(Boolean).slice(0, 20)
      setImportMsg(`Загружено ${lines.length} строк из файла. Добавь события вручную на основе этих данных — функция ИИ-разбора будет доступна позже.`)
    }
    reader.readAsText(file)
  }

  const handleUrl = () => {
    if (!urlInput.trim()) return
    setImportMsg(`Ссылка сохранена: ${urlInput}. Парсинг страницы учебного заведения будет доступен после подключения ИИ.`)
  }

  const eventsForDay = (day: number) => events.filter(e => e.day_of_week === day).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))

  return (
    <motion.div
      className={`min-h-screen ${theme.bg}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
    >
      {/* Header */}
      <div className={`sticky top-0 z-20 ${theme.cardBg} ${theme.border} border-b px-4 py-3 flex items-center gap-3`}>
        <button onClick={onBack} className={`p-2 rounded-full ${theme.border} border ${theme.text}`}>
          <ArrowLeft size={18} />
        </button>
        <h1 className={`font-bold text-lg ${theme.text}`}>Расписание</h1>
        <div className="flex-1" />
        <button onClick={() => setTab("add")} className={`p-2 rounded-full ${theme.buttonBg} ${theme.buttonText}`}>
          <Plus size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${theme.border} ${theme.cardBg}`}>
        {[["week", "Неделя"], ["add", "Добавить"], ["import", "Импорт"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === key ? `${theme.text} border-b-2 border-current` : theme.textSecondary}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto px-4 py-6">

        {/* WEEK VIEW */}
        {tab === "week" && (
          <div className="space-y-6">
            {loading && <p className={`text-center ${theme.textSecondary}`}>Загружаю...</p>}
            {!loading && events.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-12 ${theme.textSecondary}`}>
                <Icon name="CalendarDays" size={48} fallback="Calendar" />
                <p className="mt-4 font-medium">Расписание пустое</p>
                <p className="text-sm mt-1">Добавь события вручную или импортируй</p>
                <button onClick={() => setTab("add")} className={`mt-4 px-6 py-2 rounded-lg ${theme.buttonBg} ${theme.buttonText} text-sm font-medium`}>
                  + Добавить
                </button>
              </motion.div>
            )}
            {DAYS.map((day, i) => {
              const dayEvents = eventsForDay(i + 1)
              if (dayEvents.length === 0) return null
              return (
                <div key={day}>
                  <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} mb-2`}>{day}</p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {dayEvents.map(ev => {
                        const t = EVENT_TYPES[ev.event_type] || EVENT_TYPES.study
                        const IconComp = t.icon
                        return (
                          <motion.div
                            key={ev.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`flex items-center gap-3 p-3 rounded-lg ${theme.cardBg} ${theme.border} border`}
                          >
                            <div className={`p-2 rounded-full ${t.bg}`}>
                              <IconComp size={16} className={t.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${theme.text} truncate`}>{ev.title}</p>
                              {(ev.start_time || ev.end_time) && (
                                <p className={`text-xs ${theme.textSecondary}`}>{ev.start_time} — {ev.end_time}</p>
                              )}
                            </div>
                            <button onClick={() => deleteEvent(ev.id)} className="p-1 opacity-40 hover:opacity-100 transition-opacity">
                              <Trash2 size={14} className={theme.text} />
                            </button>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ADD FORM */}
        {tab === "add" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>Название</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Напр. Математика, Дедлайн по диплому..."
                className={`w-full p-3 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>Тип</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(EVENT_TYPES).map(([key, t]) => {
                  const IconComp = t.icon
                  return (
                    <button
                      key={key}
                      onClick={() => setForm(f => ({ ...f, event_type: key }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${form.event_type === key ? `${t.bg} ${t.color} border-current` : `${theme.cardBg} ${theme.border} ${theme.textSecondary}`}`}
                    >
                      <IconComp size={16} />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>День недели</label>
              <div className="flex gap-1">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setForm(f => ({ ...f, day_of_week: i + 1 }))}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-all ${form.day_of_week === i + 1 ? `${theme.buttonBg} ${theme.buttonText}` : `${theme.cardBg} ${theme.border} ${theme.text}`}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>Начало</label>
                <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className={`w-full p-3 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none`} />
              </div>
              <div className="flex-1">
                <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>Конец</label>
                <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className={`w-full p-3 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none`} />
              </div>
            </div>
            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>Описание (необязательно)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Заметки..."
                className={`w-full p-3 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none resize-none`}
              />
            </div>
            <button
              onClick={addEvent}
              disabled={saving || !form.title.trim()}
              className={`w-full py-3 rounded-lg font-semibold text-sm ${theme.buttonBg} ${theme.buttonText} disabled:opacity-50 transition-opacity`}
            >
              {saving ? "Сохраняю..." : "Добавить в расписание"}
            </button>
          </motion.div>
        )}

        {/* IMPORT */}
        {tab === "import" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* File upload */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed ${theme.border} rounded-xl p-8 text-center cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <Upload size={32} className={`mx-auto mb-3 ${theme.textSecondary}`} />
              <p className={`font-medium ${theme.text}`}>Загрузить файл</p>
              <p className={`text-xs mt-1 ${theme.textSecondary}`}>PDF, Excel, CSV с расписанием</p>
              <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.txt" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
            </div>

            {/* URL import */}
            <div>
              <p className={`font-medium ${theme.text} mb-2`}>Ссылка на страницу вуза</p>
              <div className="flex gap-2">
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://university.ru/schedule"
                  className={`flex-1 p-3 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none`}
                />
                <button onClick={handleUrl} className={`px-4 py-3 rounded-lg ${theme.buttonBg} ${theme.buttonText}`}>
                  <Link size={16} />
                </button>
              </div>
            </div>

            {importMsg && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-lg ${theme.cardBg} ${theme.border} border`}>
                <p className={`text-sm ${theme.textSecondary}`}>{importMsg}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
