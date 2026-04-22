import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Trash2, Briefcase, Heart, Users, Dumbbell, Coffee, Star, Clock, MapPin } from "lucide-react"
import Icon from "@/components/ui/icon"

const SCHEDULE_URL = "https://functions.poehali.dev/afbe3ff0-d6e8-45b1-8c3b-5baefbfc00f2"

const SESSION_ID = (() => {
  let id = localStorage.getItem("balance_session")
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("balance_session", id) }
  return id
})()

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

export type SectionType = "work" | "rest" | "social"

interface SectionConfig {
  title: string
  icon: typeof Briefcase
  accentBg: string
  accentText: string
  eventType: string
  emptyText: string
  emptySubtext: string
  addPlaceholder: string
  subtypes: { key: string; label: string; icon: typeof Briefcase }[]
  tips: string[]
}

const SECTION_CONFIGS: Record<SectionType, SectionConfig> = {
  work: {
    title: "Работа",
    icon: Briefcase,
    accentBg: "bg-amber-100",
    accentText: "text-amber-700",
    eventType: "work",
    emptyText: "График работы пустой",
    emptySubtext: "Добавь смены, подработку или карьерные задачи",
    addPlaceholder: "Напр. Смена в кафе, Фриланс-проект...",
    subtypes: [
      { key: "work", label: "Смена", icon: Briefcase },
      { key: "work", label: "Задача", icon: Star },
      { key: "work", label: "Встреча", icon: Clock },
    ],
    tips: [
      "Не бери смены подряд без перерыва — минимум 30 мин отдыха",
      "Старайся не совмещать работу с учёбой в один день",
      "2–3 рабочих дня в неделю — оптимально для студента",
    ],
  },
  rest: {
    title: "Отдых",
    icon: Heart,
    accentBg: "bg-pink-100",
    accentText: "text-pink-700",
    eventType: "rest",
    emptyText: "Отдых не запланирован",
    emptySubtext: "Добавь время для восстановления и спорта",
    addPlaceholder: "Напр. Прогулка, Сон, Тренировка...",
    subtypes: [
      { key: "rest", label: "Отдых", icon: Heart },
      { key: "sport", label: "Спорт", icon: Dumbbell },
      { key: "rest", label: "Хобби", icon: Coffee },
    ],
    tips: [
      "15 минут отдыха после каждого часа активности обязательны",
      "Рекомендуем 2–3 тренировки в неделю по 30–40 минут",
      "Сон 7–9 часов — лучшее восстановление для мозга",
    ],
  },
  social: {
    title: "Социальная жизнь",
    icon: Users,
    accentBg: "bg-purple-100",
    accentText: "text-purple-700",
    eventType: "social",
    emptyText: "Социальных событий нет",
    emptySubtext: "Запланируй встречи с друзьями и мероприятия",
    addPlaceholder: "Напр. Встреча с друзьями, Вечеринка, Кино...",
    subtypes: [
      { key: "social", label: "Встреча", icon: Users },
      { key: "social", label: "Событие", icon: Star },
      { key: "social", label: "Место", icon: MapPin },
    ],
    tips: [
      "Социальная жизнь — не роскошь, а необходимость для баланса",
      "Хотя бы 1 встреча с друзьями в неделю снижает стресс",
      "Планируй социальные события заранее, чтобы не забывать о них",
    ],
  },
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

interface ThemeProps {
  bg: string; cardBg: string; text: string; textSecondary: string
  border: string; buttonBg: string; buttonText: string
}

interface Props {
  section: SectionType
  onBack: () => void
  theme: ThemeProps
}

export default function SectionScreen({ section, onBack, theme }: Props) {
  const config = SECTION_CONFIGS[section]
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"week" | "add" | "tips">("week")
  const [form, setForm] = useState({
    title: "",
    event_type: config.eventType,
    day_of_week: 1,
    start_time: "10:00",
    end_time: "11:00",
    description: "",
  })
  const [saving, setSaving] = useState(false)

  const headers = { "Content-Type": "application/json", "X-Session-Id": SESSION_ID }

  useEffect(() => {
    fetch(SCHEDULE_URL, { headers })
      .then(r => r.json())
      .then(d => {
        const all: ScheduleEvent[] = d.events || []
        const filtered = section === "rest"
          ? all.filter(e => e.event_type === "rest" || e.event_type === "sport")
          : all.filter(e => e.event_type === config.eventType)
        setEvents(filtered)
      })
      .finally(() => setLoading(false))
  }, [])

  const addEvent = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const res = await fetch(SCHEDULE_URL, { method: "POST", headers, body: JSON.stringify({ ...form, source: "manual" }) })
    const data = await res.json()
    if (data.id) {
      setEvents(prev => [...prev, { ...form, id: data.id, source: "manual" }])
      setForm({ title: "", event_type: config.eventType, day_of_week: 1, start_time: "10:00", end_time: "11:00", description: "" })
      setTab("week")
    }
    setSaving(false)
  }

  const deleteEvent = async (id: string) => {
    await fetch(`${SCHEDULE_URL}?id=${id}`, { method: "DELETE", headers })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const eventsForDay = (day: number) =>
    events.filter(e => e.day_of_week === day).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))

  const IconMain = config.icon

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
        <div className={`p-2 rounded-full ${config.accentBg}`}>
          <IconMain size={18} className={config.accentText} />
        </div>
        <h1 className={`font-bold text-lg ${theme.text}`}>{config.title}</h1>
        <div className="flex-1" />
        <button onClick={() => setTab("add")} className={`p-2 rounded-full ${theme.buttonBg} ${theme.buttonText}`}>
          <Plus size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${theme.border} ${theme.cardBg}`}>
        {[["week", "Неделя"], ["add", "Добавить"], ["tips", "Советы"]].map(([key, label]) => (
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
                <div className={`w-16 h-16 rounded-full ${config.accentBg} flex items-center justify-center mx-auto mb-4`}>
                  <IconMain size={32} className={config.accentText} />
                </div>
                <p className={`font-medium ${theme.text}`}>{config.emptyText}</p>
                <p className="text-sm mt-1">{config.emptySubtext}</p>
                <button
                  onClick={() => setTab("add")}
                  className={`mt-4 px-6 py-2 rounded-lg ${theme.buttonBg} ${theme.buttonText} text-sm font-medium`}
                >
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
                      {dayEvents.map(ev => (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`flex items-center gap-3 p-3 rounded-lg ${theme.cardBg} ${theme.border} border`}
                        >
                          <div className={`p-2 rounded-full ${config.accentBg}`}>
                            <IconMain size={16} className={config.accentText} />
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
                      ))}
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
            {/* Subtypes */}
            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-2 block`}>Категория</label>
              <div className="flex gap-2">
                {config.subtypes.map((st) => {
                  const StIcon = st.icon
                  return (
                    <button
                      key={st.label}
                      onClick={() => setForm(f => ({ ...f, event_type: st.key }))}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${
                        form.event_type === st.key
                          ? `${config.accentBg} ${config.accentText} border-current`
                          : `${theme.cardBg} ${theme.border} ${theme.textSecondary}`
                      }`}
                    >
                      <StIcon size={16} />
                      {st.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>Название</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={config.addPlaceholder}
                className={`w-full p-3 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none`}
              />
            </div>

            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>День недели</label>
              <div className="flex gap-1">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setForm(f => ({ ...f, day_of_week: i + 1 }))}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                      form.day_of_week === i + 1
                        ? `${theme.buttonBg} ${theme.buttonText}`
                        : `${theme.cardBg} ${theme.border} ${theme.text}`
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>Начало</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className={`w-full p-3 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none`}
                />
              </div>
              <div className="flex-1">
                <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>Конец</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className={`w-full p-3 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none`}
                />
              </div>
            </div>

            <div>
              <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>Заметка (необязательно)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Детали..."
                className={`w-full p-3 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none resize-none`}
              />
            </div>

            <button
              onClick={addEvent}
              disabled={saving || !form.title.trim()}
              className={`w-full py-3 rounded-lg font-semibold text-sm ${theme.buttonBg} ${theme.buttonText} disabled:opacity-50 transition-opacity`}
            >
              {saving ? "Сохраняю..." : `Добавить в ${config.title.toLowerCase()}`}
            </button>
          </motion.div>
        )}

        {/* TIPS */}
        {tab === "tips" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className={`text-sm font-medium ${theme.textSecondary} mb-4`}>Советы для баланса</p>
            {config.tips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex gap-3 p-4 rounded-lg ${theme.cardBg} ${theme.border} border`}
              >
                <div className={`w-7 h-7 rounded-full ${config.accentBg} flex items-center justify-center shrink-0`}>
                  <span className={`text-xs font-bold ${config.accentText}`}>{i + 1}</span>
                </div>
                <p className={`text-sm ${theme.text} leading-relaxed`}>{tip}</p>
              </motion.div>
            ))}

            {/* Stats placeholder */}
            <div className={`mt-6 p-4 rounded-lg ${theme.cardBg} ${theme.border} border`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} mb-3`}>На этой неделе</p>
              <div className="flex justify-around text-center">
                <div>
                  <p className={`text-2xl font-bold ${theme.text}`}>{events.length}</p>
                  <p className={`text-xs ${theme.textSecondary}`}>событий</p>
                </div>
                <div className={`w-px ${theme.border} border-l`} />
                <div>
                  <p className={`text-2xl font-bold ${theme.text}`}>
                    {events.filter(e => e.day_of_week && e.day_of_week > 0).reduce((acc, e) => {
                      const start = e.start_time?.split(":").map(Number)
                      const end = e.end_time?.split(":").map(Number)
                      if (start && end) return acc + ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1]))
                      return acc
                    }, 0) / 60 | 0}ч
                  </p>
                  <p className={`text-xs ${theme.textSecondary}`}>запланировано</p>
                </div>
                <div className={`w-px ${theme.border} border-l`} />
                <div>
                  <p className={`text-2xl font-bold ${theme.text}`}>
                    {new Set(events.map(e => e.day_of_week)).size}
                  </p>
                  <p className={`text-xs ${theme.textSecondary}`}>дней</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
