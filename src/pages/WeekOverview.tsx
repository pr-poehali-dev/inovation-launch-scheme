import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Briefcase, Heart, Users, Dumbbell, AlertCircle } from "lucide-react"

const SCHEDULE_URL = "https://functions.poehali.dev/afbe3ff0-d6e8-45b1-8c3b-5baefbfc00f2"

const SESSION_ID = (() => {
  let id = localStorage.getItem("balance_session")
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("balance_session", id) }
  return id
})()

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

const TYPE_CONFIG: Record<string, { label: string; icon: typeof BookOpen; color: string; bg: string; bar: string }> = {
  study:    { label: "Учёба",    icon: BookOpen,     color: "text-blue-700",   bg: "bg-blue-100",   bar: "bg-blue-500" },
  work:     { label: "Работа",   icon: Briefcase,    color: "text-amber-700",  bg: "bg-amber-100",  bar: "bg-amber-500" },
  deadline: { label: "Дедлайн",  icon: AlertCircle,  color: "text-red-700",    bg: "bg-red-100",    bar: "bg-red-500" },
  sport:    { label: "Спорт",    icon: Dumbbell,     color: "text-green-700",  bg: "bg-green-100",  bar: "bg-green-500" },
  rest:     { label: "Отдых",    icon: Heart,        color: "text-pink-700",   bg: "bg-pink-100",   bar: "bg-pink-500" },
  social:   { label: "Соцжизнь", icon: Users,        color: "text-purple-700", bg: "bg-purple-100", bar: "bg-purple-500" },
}

interface ScheduleEvent {
  id: string
  title: string
  event_type: string
  day_of_week: number
  start_time: string
  end_time: string
  description: string
}

interface ThemeProps {
  bg: string; cardBg: string; text: string; textSecondary: string
  border: string; buttonBg: string; buttonText: string
}

interface Props {
  onBack: () => void
  hideBack?: boolean
  theme: ThemeProps
}

function getMinutes(t?: string) {
  if (!t) return 0
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m || 0)
}

function getDuration(ev: ScheduleEvent) {
  return Math.max(0, getMinutes(ev.end_time) - getMinutes(ev.start_time))
}

export default function WeekOverview({ onBack, hideBack, theme }: Props) {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(SCHEDULE_URL, { headers: { "Content-Type": "application/json", "X-Session-Id": SESSION_ID } })
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
      .finally(() => setLoading(false))
  }, [])

  // Stats by type
  const statsByType = Object.keys(TYPE_CONFIG).map(type => {
    const typeEvents = events.filter(e => e.event_type === type)
    const totalMin = typeEvents.reduce((acc, e) => acc + getDuration(e), 0)
    return { type, count: typeEvents.length, hours: Math.round(totalMin / 60 * 10) / 10 }
  }).filter(s => s.count > 0)

  const totalHours = statsByType.reduce((acc, s) => acc + s.hours, 0)
  const maxHours = Math.max(...statsByType.map(s => s.hours), 1)

  // Events per day
  const eventsForDay = (day: number) =>
    events.filter(e => e.day_of_week === day).sort((a, b) => getMinutes(a.start_time) - getMinutes(b.start_time))

  // Balance score (0–100): how evenly distributed across study/work/rest/social
  const hasStudy = events.some(e => e.event_type === "study")
  const hasWork = events.some(e => e.event_type === "work")
  const hasRest = events.some(e => e.event_type === "rest" || e.event_type === "sport")
  const hasSocial = events.some(e => e.event_type === "social")
  const score = Math.round(([hasStudy, hasWork, hasRest, hasSocial].filter(Boolean).length / 4) * 100)

  const scoreLabel = score === 100 ? "Отличный баланс!" : score >= 75 ? "Почти идеально" : score >= 50 ? "Есть пробелы" : score > 0 ? "Нужно добавить" : "Расписание пусто"
  const scoreColor = score === 100 ? "text-green-600" : score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500"
  const scoreBarColor = score === 100 ? "bg-green-500" : score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-400"

  return (
    <motion.div
      className={`min-h-screen ${theme.bg}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className={`sticky top-0 z-20 ${theme.cardBg} ${theme.border} border-b px-4 py-3 flex items-center gap-3`}>
        {!hideBack && (
          <button onClick={onBack} className={`p-2 rounded-full ${theme.border} border ${theme.text}`}>
            <ArrowLeft size={18} />
          </button>
        )}
        {hideBack && <div className="w-2" />}
        <h1 className={`font-bold text-lg ${theme.text}`}>Обзор недели</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">

        {loading && <p className={`text-center py-12 ${theme.textSecondary}`}>Загружаю...</p>}

        {!loading && (
          <>
            {/* Balance Score */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl ${theme.cardBg} ${theme.border} border`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary}`}>Индекс баланса</p>
                <p className={`text-sm font-semibold ${scoreColor}`}>{scoreLabel}</p>
              </div>
              <div className={`w-full h-3 rounded-full ${theme.border} border overflow-hidden bg-gray-100`}>
                <motion.div
                  className={`h-full rounded-full ${scoreBarColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${theme.textSecondary}`}>0%</span>
                <span className={`text-xs font-bold ${scoreColor}`}>{score}%</span>
                <span className={`text-xs ${theme.textSecondary}`}>100%</span>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                {[
                  { label: "Учёба", ok: hasStudy },
                  { label: "Работа", ok: hasWork },
                  { label: "Отдых", ok: hasRest },
                  { label: "Соцжизнь", ok: hasSocial },
                ].map(item => (
                  <span key={item.label} className={`text-xs px-3 py-1 rounded-full font-medium ${item.ok ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {item.ok ? "✓" : "+"} {item.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Hours by Type */}
            {statsByType.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`p-5 rounded-xl ${theme.cardBg} ${theme.border} border`}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary}`}>Часы по сферам</p>
                  <p className={`text-sm font-semibold ${theme.text}`}>{totalHours}ч всего</p>
                </div>
                <div className="space-y-3">
                  {statsByType.map((s, i) => {
                    const cfg = TYPE_CONFIG[s.type]
                    const IconComp = cfg.icon
                    return (
                      <motion.div
                        key={s.type}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.07 }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`p-1 rounded ${cfg.bg}`}>
                            <IconComp size={12} className={cfg.color} />
                          </div>
                          <span className={`text-xs font-medium ${theme.text}`}>{cfg.label}</span>
                          <span className={`ml-auto text-xs ${theme.textSecondary}`}>{s.hours}ч · {s.count} событий</span>
                        </div>
                        <div className={`w-full h-2 rounded-full bg-gray-100 overflow-hidden`}>
                          <motion.div
                            className={`h-full rounded-full ${cfg.bar}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(s.hours / maxHours) * 100}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 + i * 0.07 }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Day-by-day timeline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-5 rounded-xl ${theme.cardBg} ${theme.border} border`}
            >
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} mb-4`}>По дням</p>
              <div className="space-y-3">
                {DAYS.map((day, i) => {
                  const dayEvs = eventsForDay(i + 1)
                  return (
                    <div key={day} className="flex gap-3 items-start">
                      <span className={`text-xs font-bold w-6 pt-0.5 shrink-0 ${theme.textSecondary}`}>{day}</span>
                      <div className="flex-1 flex flex-wrap gap-1 min-h-[24px]">
                        {dayEvs.length === 0 && (
                          <span className={`text-xs ${theme.textSecondary} opacity-40`}>—</span>
                        )}
                        {dayEvs.map(ev => {
                          const cfg = TYPE_CONFIG[ev.event_type] || TYPE_CONFIG.study
                          const IconComp = cfg.icon
                          return (
                            <span key={ev.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>
                              <IconComp size={10} />
                              {ev.title.length > 14 ? ev.title.slice(0, 14) + "…" : ev.title}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Empty state */}
            {events.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-8 ${theme.textSecondary}`}>
                <p className="font-medium">Пока нет событий</p>
                <p className="text-sm mt-1">Добавь события в каждый раздел, чтобы увидеть обзор недели</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}