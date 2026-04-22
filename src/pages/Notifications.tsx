import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Bell, BellOff, Clock, BookOpen, Briefcase, Heart, Users, Dumbbell, Check } from "lucide-react"

const SCHEDULE_URL = "https://functions.poehali.dev/afbe3ff0-d6e8-45b1-8c3b-5baefbfc00f2"
const SESSION_ID = (() => {
  let id = localStorage.getItem("balance_session")
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("balance_session", id) }
  return id
})()

interface ThemeProps {
  bg: string; cardBg: string; text: string; textSecondary: string
  border: string; buttonBg: string; buttonText: string
}

interface Props {
  onBack: () => void
  theme: ThemeProps
}

interface NotifSettings {
  enabled: boolean
  beforeMinutes: number
  restReminder: boolean
  restIntervalHours: number
  sportReminder: boolean
  socialReminder: boolean
  morningDigest: boolean
  morningTime: string
}

const DEFAULT_SETTINGS: NotifSettings = {
  enabled: false,
  beforeMinutes: 15,
  restReminder: true,
  restIntervalHours: 1,
  sportReminder: true,
  socialReminder: true,
  morningDigest: true,
  morningTime: "08:00",
}

const BEFORE_OPTIONS = [5, 10, 15, 30, 60]

interface ScheduleEvent {
  id: string
  title: string
  event_type: string
  day_of_week: number
  start_time: string
}

function scheduleEventNotification(event: ScheduleEvent, beforeMinutes: number) {
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  if (event.day_of_week !== dayOfWeek) return
  if (!event.start_time) return

  const [h, m] = event.start_time.split(":").map(Number)
  const eventTime = new Date()
  eventTime.setHours(h, m, 0, 0)
  const notifTime = new Date(eventTime.getTime() - beforeMinutes * 60 * 1000)
  const delay = notifTime.getTime() - now.getTime()
  if (delay < 0) return

  setTimeout(() => {
    new Notification(`Скоро: ${event.title}`, {
      body: `Начало через ${beforeMinutes} мин — ${event.start_time}`,
      icon: "/favicon.svg",
      tag: `event-${event.id}`,
    })
  }, delay)
}

function scheduleRestReminders(intervalHours: number) {
  const intervalMs = intervalHours * 60 * 60 * 1000
  const remind = () => {
    new Notification("Время отдохнуть!", {
      body: "Ты активен уже час. Сделай паузу на 15 минут — это повысит продуктивность.",
      icon: "/favicon.svg",
      tag: "rest-reminder",
    })
  }
  // First reminder after interval
  const timer = setInterval(remind, intervalMs)
  return timer
}

function scheduleMorningDigest(time: string, events: ScheduleEvent[]) {
  const now = new Date()
  const [h, m] = time.split(":").map(Number)
  const digest = new Date()
  digest.setHours(h, m, 0, 0)
  if (digest <= now) digest.setDate(digest.getDate() + 1)
  const delay = digest.getTime() - now.getTime()

  setTimeout(() => {
    const today = now.getDay() === 0 ? 7 : now.getDay()
    const todayEvents = events.filter(e => e.day_of_week === today)
    const count = todayEvents.length
    new Notification("Доброе утро! Твой план на сегодня", {
      body: count > 0
        ? `${count} событий: ${todayEvents.map(e => e.title).slice(0, 3).join(", ")}${count > 3 ? " и ещё..." : ""}`
        : "Сегодня свободный день. Отличное время для отдыха!",
      icon: "/favicon.svg",
      tag: "morning-digest",
    })
  }, delay)
}

export default function Notifications({ onBack, theme }: Props) {
  const [settings, setSettings] = useState<NotifSettings>(() => {
    try {
      const saved = localStorage.getItem("balance_notif_settings")
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch { return DEFAULT_SETTINGS }
  })
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [saved, setSaved] = useState(false)
  const [restTimer, setRestTimer] = useState<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setPermission(Notification.permission)
    fetch(SCHEDULE_URL, { headers: { "Content-Type": "application/json", "X-Session-Id": SESSION_ID } })
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
  }, [])

  const requestPermission = async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === "granted") {
      setSettings(s => ({ ...s, enabled: true }))
    }
  }

  const applySettings = (s: NotifSettings, evs: ScheduleEvent[]) => {
    if (restTimer) clearInterval(restTimer)
    if (!s.enabled || permission !== "granted") return

    // Event reminders
    evs.forEach(ev => scheduleEventNotification(ev, s.beforeMinutes))

    // Rest reminder
    if (s.restReminder) {
      const t = scheduleRestReminders(s.restIntervalHours)
      setRestTimer(t)
    }

    // Morning digest
    if (s.morningDigest) scheduleMorningDigest(s.morningTime, evs)

    // Sport reminder (once a day at noon if no sport events today)
    if (s.sportReminder) {
      const today = new Date().getDay() === 0 ? 7 : new Date().getDay()
      const hasSport = evs.some(e => (e.event_type === "sport") && e.day_of_week === today)
      if (!hasSport) {
        const noon = new Date(); noon.setHours(12, 0, 0, 0)
        const delay = noon.getTime() - Date.now()
        if (delay > 0) {
          setTimeout(() => {
            new Notification("Не забудь про тренировку!", {
              body: "Сегодня ещё нет спорта в расписании. 30 минут активности — и день засчитан!",
              icon: "/favicon.svg",
              tag: "sport-reminder",
            })
          }, delay)
        }
      }
    }
  }

  const save = () => {
    localStorage.setItem("balance_notif_settings", JSON.stringify(settings))
    applySettings(settings, events)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const update = (patch: Partial<NotifSettings>) => setSettings(s => ({ ...s, ...patch }))

  const Row = ({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className={`flex items-center justify-between p-4 rounded-lg ${theme.cardBg} ${theme.border} border`}>
      <div>
        <p className={`text-sm font-medium ${theme.text}`}>{label}</p>
        {sub && <p className={`text-xs mt-0.5 ${theme.textSecondary}`}>{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-all duration-200 relative ${checked ? theme.buttonBg : "bg-gray-200"}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${checked ? "left-7" : "left-1"}`} />
      </button>
    </div>
  )

  const notifSupported = "Notification" in window

  return (
    <motion.div
      className={`min-h-screen ${theme.bg}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Header */}
      <div className={`sticky top-0 z-20 ${theme.cardBg} ${theme.border} border-b px-4 py-3 flex items-center gap-3`}>
        <button onClick={onBack} className={`p-2 rounded-full ${theme.border} border ${theme.text}`}>
          <ArrowLeft size={18} />
        </button>
        <Bell size={18} className={theme.text} />
        <h1 className={`font-bold text-lg ${theme.text}`}>Напоминания</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* Not supported */}
        {!notifSupported && (
          <div className={`p-4 rounded-xl ${theme.cardBg} ${theme.border} border text-center`}>
            <BellOff size={32} className={`mx-auto mb-2 ${theme.textSecondary}`} />
            <p className={`font-medium ${theme.text}`}>Уведомления недоступны</p>
            <p className={`text-sm mt-1 ${theme.textSecondary}`}>Твой браузер не поддерживает push-уведомления. Попробуй Chrome или Safari.</p>
          </div>
        )}

        {notifSupported && (
          <>
            {/* Permission block */}
            {permission !== "granted" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-xl ${theme.cardBg} ${theme.border} border text-center`}
              >
                <Bell size={36} className={`mx-auto mb-3 ${theme.textSecondary}`} />
                <p className={`font-semibold ${theme.text} mb-1`}>Разреши уведомления</p>
                <p className={`text-sm ${theme.textSecondary} mb-4`}>
                  {permission === "denied"
                    ? "Уведомления заблокированы в настройках браузера. Разреши их вручную и обнови страницу."
                    : "Нажми кнопку — браузер спросит разрешение. Это нужно один раз."}
                </p>
                {permission !== "denied" && (
                  <button
                    onClick={requestPermission}
                    className={`px-6 py-2.5 rounded-lg font-semibold text-sm ${theme.buttonBg} ${theme.buttonText}`}
                  >
                    Разрешить уведомления
                  </button>
                )}
              </motion.div>
            )}

            {permission === "granted" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 w-fit"
              >
                <Check size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">Уведомления разрешены</span>
              </motion.div>
            )}

            {/* Master toggle */}
            <div className="space-y-2">
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} px-1`}>Основное</p>
              <Row
                label="Включить напоминания"
                sub="Все уведомления от Balance"
                checked={settings.enabled}
                onChange={v => {
                  if (v && permission !== "granted") { requestPermission(); return }
                  update({ enabled: v })
                }}
              />
            </div>

            {/* Before event */}
            <div className={`space-y-3 transition-opacity ${!settings.enabled ? "opacity-40 pointer-events-none" : ""}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} px-1`}>До события</p>
              <div className={`p-4 rounded-lg ${theme.cardBg} ${theme.border} border`}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className={theme.textSecondary} />
                  <p className={`text-sm font-medium ${theme.text}`}>Напомнить за...</p>
                </div>
                <div className="flex gap-2">
                  {BEFORE_OPTIONS.map(min => (
                    <button
                      key={min}
                      onClick={() => update({ beforeMinutes: min })}
                      className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-all ${
                        settings.beforeMinutes === min
                          ? `${theme.buttonBg} ${theme.buttonText}`
                          : `${theme.cardBg} ${theme.border} ${theme.text}`
                      }`}
                    >
                      {min < 60 ? `${min}м` : "1ч"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart reminders */}
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} px-1 pt-2`}>Умные напоминания</p>

              <Row
                label="Напомни отдохнуть"
                sub={`Каждые ${settings.restIntervalHours} час — 15 минут на паузу`}
                checked={settings.restReminder}
                onChange={v => update({ restReminder: v })}
              />

              {settings.restReminder && (
                <div className={`p-4 rounded-lg ${theme.cardBg} ${theme.border} border`}>
                  <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>Интервал напоминания</p>
                  <div className="flex gap-2">
                    {[1, 1.5, 2].map(h => (
                      <button
                        key={h}
                        onClick={() => update({ restIntervalHours: h })}
                        className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-all ${
                          settings.restIntervalHours === h
                            ? `${theme.buttonBg} ${theme.buttonText}`
                            : `${theme.cardBg} ${theme.border} ${theme.text}`
                        }`}
                      >
                        {h === 1 ? "1 час" : h === 1.5 ? "1.5 часа" : "2 часа"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Row
                label="Напомни про спорт"
                sub="Если сегодня нет тренировки — пришлю напоминание в 12:00"
                checked={settings.sportReminder}
                onChange={v => update({ sportReminder: v })}
              />

              <Row
                label="Напомни про друзей"
                sub="Если давно нет социальных событий — подтолкну"
                checked={settings.socialReminder}
                onChange={v => update({ socialReminder: v })}
              />

              {/* Morning digest */}
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} px-1 pt-2`}>Утренний дайджест</p>

              <Row
                label="Сводка на день"
                sub="Краткий план событий каждое утро"
                checked={settings.morningDigest}
                onChange={v => update({ morningDigest: v })}
              />

              {settings.morningDigest && (
                <div className={`p-4 rounded-lg ${theme.cardBg} ${theme.border} border`}>
                  <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>Время сводки</p>
                  <input
                    type="time"
                    value={settings.morningTime}
                    onChange={e => update({ morningTime: e.target.value })}
                    className={`w-full p-3 rounded-lg ${theme.bg} ${theme.border} border ${theme.text} text-sm outline-none`}
                  />
                </div>
              )}

              {/* Icons legend */}
              <div className={`p-4 rounded-xl ${theme.cardBg} ${theme.border} border`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} mb-3`}>Что будет в уведомлениях</p>
                <div className="space-y-2">
                  {[
                    { icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100", text: "Пары и дедлайны по учёбе" },
                    { icon: Briefcase, color: "text-amber-600", bg: "bg-amber-100", text: "Смены и рабочие задачи" },
                    { icon: Heart, color: "text-pink-600", bg: "bg-pink-100", text: "Напоминания об отдыхе" },
                    { icon: Dumbbell, color: "text-green-600", bg: "bg-green-100", text: "Тренировки и спорт" },
                    { icon: Users, color: "text-purple-600", bg: "bg-purple-100", text: "Встречи и мероприятия" },
                  ].map(({ icon: Ic, color, bg, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${bg}`}><Ic size={12} className={color} /></div>
                      <p className={`text-xs ${theme.text}`}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={save}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  saved ? "bg-green-500 text-white" : `${theme.buttonBg} ${theme.buttonText}`
                }`}
              >
                {saved ? "✓ Сохранено!" : "Сохранить настройки"}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
