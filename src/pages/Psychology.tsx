import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Star, Clock, ChevronRight, X, Check, Calendar } from "lucide-react"

const API_URL = "https://functions.poehali.dev/c0f712d5-bb39-4286-a3de-54b3bc9a7cfa"
const SESSION_ID = (() => {
  let id = localStorage.getItem("balance_session")
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("balance_session", id) }
  return id
})()

const DAYS_SHORT = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
const DAYS_FULL = ["", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]

interface Psychologist {
  id: string
  name: string
  avatar_initials: string
  year_of_study: number
  university: string
  specialization: string[]
  about: string
  rating: number
  sessions_count: number
  session_duration_min: number
}

interface Slot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

interface Booking {
  id: string
  status: string
  session_date: string
  psychologist_name: string
  avatar_initials: string
  session_duration_min: number
  start_time: string
  end_time: string
  notes: string
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

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

function getNextDate(dayOfWeek: number): string {
  const today = new Date()
  const currentDay = today.getDay() === 0 ? 7 : today.getDay()
  let diff = dayOfWeek - currentDay
  if (diff <= 0) diff += 7
  const date = new Date(today)
  date.setDate(today.getDate() + diff)
  return date.toISOString().split("T")[0]
}

export default function Psychology({ onBack, hideBack, theme }: Props) {
  const [tab, setTab] = useState<"catalog" | "mybookings">("catalog")
  const [psychologists, setPsychologists] = useState<Psychologist[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Psychologist | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [bookingStep, setBookingStep] = useState<"slots" | "confirm" | "done">("slots")
  const [notes, setNotes] = useState("")
  const [booking, setBooking] = useState(false)
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const headers = { "Content-Type": "application/json", "X-Session-Id": SESSION_ID }

  useEffect(() => {
    fetch(`${API_URL}?action=list`, { headers })
      .then(r => r.json())
      .then(d => setPsychologists(d.psychologists || []))
      .finally(() => setLoading(false))
  }, [])

  const loadBookings = () => {
    fetch(`${API_URL}?action=my_bookings`, { headers })
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []))
  }

  const openPsychologist = (p: Psychologist) => {
    setSelected(p)
    setSelectedSlot(null)
    setBookingStep("slots")
    setNotes("")
    setSlotsLoading(true)
    fetch(`${API_URL}?action=slots&psychologist_id=${p.id}`, { headers })
      .then(r => r.json())
      .then(d => setSlots(d.slots || []))
      .finally(() => setSlotsLoading(false))
  }

  const confirmBooking = async () => {
    if (!selected || !selectedSlot) return
    setBooking(true)
    const userName = localStorage.getItem("balance_name") || ""
    const sessionDate = getNextDate(selectedSlot.day_of_week)
    const res = await fetch(API_URL, {
      method: "POST", headers,
      body: JSON.stringify({
        psychologist_id: selected.id,
        slot_id: selectedSlot.id,
        session_date: sessionDate,
        user_name: userName,
        notes,
      }),
    })
    const data = await res.json()
    setBooking(false)
    if (data.id) {
      setBookingStep("done")
      loadBookings()
    }
  }

  const allTags = Array.from(new Set(psychologists.flatMap(p => p.specialization)))
  const filtered = filterTag ? psychologists.filter(p => p.specialization.includes(filterTag)) : psychologists

  // Grouped slots by day
  const slotsByDay = DAYS_SHORT.map((_, i) => ({
    day: i,
    slots: slots.filter(s => s.day_of_week === i),
  })).filter(g => g.slots.length > 0)

  return (
    <div className={`flex flex-col h-full ${theme.bg}`}>
      {/* Header */}
      <div className={`shrink-0 ${theme.cardBg} ${theme.border} border-b px-4 pt-12 pb-0`}>
        <div className="flex items-center gap-3 mb-4">
          {!hideBack && (
            <button onClick={onBack} className={`p-2 rounded-full ${theme.border} border ${theme.text}`}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className={`font-bold text-xl ${theme.text}`}>Психолог</h1>
            <p className={`text-xs ${theme.textSecondary}`}>Мини-консультации 15–30 минут</p>
          </div>
        </div>
        <div className="flex border-b-0">
          {[["catalog", "Специалисты"], ["mybookings", "Мои записи"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key as typeof tab); if (key === "mybookings") loadBookings() }}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? `${theme.text} border-current` : `${theme.textSecondary} border-transparent`}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* CATALOG */}
        {tab === "catalog" && (
          <div className="px-4 py-4">
            {/* Tag filters */}
            {allTags.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
                <button
                  onClick={() => setFilterTag(null)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!filterTag ? `${theme.buttonBg} ${theme.buttonText}` : `${theme.cardBg} ${theme.border} ${theme.textSecondary}`}`}
                >
                  Все
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterTag === tag ? `${theme.buttonBg} ${theme.buttonText}` : `${theme.cardBg} ${theme.border} ${theme.textSecondary}`}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {loading && <p className={`text-center py-12 ${theme.textSecondary}`}>Загружаю...</p>}

            <div className="space-y-3 mt-1">
              {filtered.map(p => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openPsychologist(p)}
                  className={`w-full ${theme.cardBg} ${theme.border} border rounded-2xl p-4 text-left`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full ${getAvatarColor(p.name)} flex items-center justify-center shrink-0`}>
                      <span className="text-white font-bold text-sm">{p.avatar_initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold text-sm ${theme.text}`}>{p.name}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className={`text-xs font-medium ${theme.text}`}>{p.rating}</span>
                        </div>
                      </div>
                      <p className={`text-xs ${theme.textSecondary} mt-0.5`}>{p.year_of_study} курс · {p.university}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`flex items-center gap-1 text-xs ${theme.textSecondary}`}>
                          <Clock size={11} /> {p.session_duration_min} мин
                        </span>
                        <span className={`text-xs ${theme.textSecondary}`}>{p.sessions_count} сессий</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.specialization.slice(0, 3).map(tag => (
                          <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${theme.bg} ${theme.border} border ${theme.textSecondary}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight size={16} className={`${theme.textSecondary} shrink-0 mt-1`} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* MY BOOKINGS */}
        {tab === "mybookings" && (
          <div className="px-4 py-4 space-y-3">
            {bookings.length === 0 && (
              <div className={`text-center py-16 ${theme.textSecondary}`}>
                <Calendar size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">Записей пока нет</p>
                <p className="text-sm mt-1">Выбери специалиста и запишись на сессию</p>
                <button onClick={() => setTab("catalog")} className={`mt-4 px-6 py-2 rounded-xl text-sm font-semibold ${theme.buttonBg} ${theme.buttonText}`}>
                  Выбрать психолога
                </button>
              </div>
            )}
            {bookings.map(b => (
              <div key={b.id} className={`${theme.cardBg} ${theme.border} border rounded-2xl p-4`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(b.psychologist_name)} flex items-center justify-center shrink-0`}>
                    <span className="text-white font-bold text-xs">{b.avatar_initials}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${theme.text}`}>{b.psychologist_name}</p>
                    <p className={`text-xs ${theme.textSecondary}`}>
                      {new Date(b.session_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} · {b.start_time.slice(0, 5)} — {b.end_time.slice(0, 5)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    b.status === "confirmed" ? "bg-green-100 text-green-700" :
                    b.status === "pending" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {b.status === "confirmed" ? "Подтверждено" : b.status === "pending" ? "Ожидает" : "Завершено"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PSYCHOLOGIST DETAIL MODAL */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
            <motion.div
              className={`absolute bottom-0 left-0 right-0 ${theme.bg} rounded-t-3xl max-h-[90vh] flex flex-col`}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Modal header */}
              <div className={`shrink-0 px-4 pt-4 pb-3 ${theme.cardBg} rounded-t-3xl border-b ${theme.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${getAvatarColor(selected.name)} flex items-center justify-center`}>
                      <span className="text-white font-bold">{selected.avatar_initials}</span>
                    </div>
                    <div>
                      <p className={`font-bold ${theme.text}`}>{selected.name}</p>
                      <p className={`text-xs ${theme.textSecondary}`}>{selected.year_of_study} курс · {selected.university}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className={`p-2 rounded-full ${theme.border} border ${theme.text}`}>
                    <X size={16} />
                  </button>
                </div>
                <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>{selected.about}</p>
                <div className="flex gap-4 mt-3">
                  <span className={`flex items-center gap-1 text-xs ${theme.textSecondary}`}>
                    <Star size={12} className="text-amber-400 fill-amber-400" /> {selected.rating}
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${theme.textSecondary}`}>
                    <Clock size={12} /> {selected.session_duration_min} мин
                  </span>
                  <span className={`text-xs ${theme.textSecondary}`}>{selected.sessions_count} сессий</span>
                </div>
              </div>

              {/* Booking steps */}
              <div className="flex-1 overflow-y-auto px-4 py-4">

                {/* STEP 1: Choose slot */}
                {bookingStep === "slots" && (
                  <div>
                    <p className={`text-sm font-bold ${theme.text} mb-3`}>Выбери удобное время</p>
                    {slotsLoading && <p className={`text-center ${theme.textSecondary}`}>Загружаю...</p>}
                    {!slotsLoading && slotsByDay.length === 0 && (
                      <p className={`text-center py-8 ${theme.textSecondary}`}>Нет доступных слотов</p>
                    )}
                    {slotsByDay.map(group => (
                      <div key={group.day} className="mb-4">
                        <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} mb-2`}>
                          {DAYS_FULL[group.day]}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.slots.map(slot => (
                            <button
                              key={slot.id}
                              disabled={!slot.is_available}
                              onClick={() => setSelectedSlot(slot)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                                !slot.is_available
                                  ? `opacity-30 ${theme.cardBg} ${theme.border} ${theme.textSecondary} cursor-not-allowed`
                                  : selectedSlot?.id === slot.id
                                  ? `${theme.buttonBg} ${theme.buttonText} border-transparent`
                                  : `${theme.cardBg} ${theme.border} ${theme.text}`
                              }`}
                            >
                              {slot.start_time.slice(0, 5)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {selectedSlot && (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setBookingStep("confirm")}
                        className={`w-full py-3 rounded-xl font-semibold text-sm mt-2 ${theme.buttonBg} ${theme.buttonText}`}
                      >
                        Продолжить → {DAYS_SHORT[selectedSlot.day_of_week]}, {selectedSlot.start_time.slice(0, 5)}
                      </motion.button>
                    )}
                  </div>
                )}

                {/* STEP 2: Confirm */}
                {bookingStep === "confirm" && selectedSlot && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <p className={`text-sm font-bold ${theme.text}`}>Подтверди запись</p>
                    <div className={`p-4 rounded-xl ${theme.cardBg} ${theme.border} border`}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className={theme.textSecondary}>Психолог</span>
                        <span className={`font-medium ${theme.text}`}>{selected.name}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className={theme.textSecondary}>День</span>
                        <span className={`font-medium ${theme.text}`}>{DAYS_FULL[selectedSlot.day_of_week]}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className={theme.textSecondary}>Время</span>
                        <span className={`font-medium ${theme.text}`}>{selectedSlot.start_time.slice(0, 5)} — {selectedSlot.end_time.slice(0, 5)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={theme.textSecondary}>Длительность</span>
                        <span className={`font-medium ${theme.text}`}>{selected.session_duration_min} мин</span>
                      </div>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${theme.textSecondary} mb-1 block`}>С чем хочешь поработать? (необязательно)</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Опиши коротко — это поможет психологу подготовиться..."
                        className={`w-full p-3 rounded-xl ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none resize-none`}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBookingStep("slots")}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold ${theme.cardBg} ${theme.border} border ${theme.text}`}
                      >
                        Назад
                      </button>
                      <button
                        onClick={confirmBooking}
                        disabled={booking}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold ${theme.buttonBg} ${theme.buttonText} disabled:opacity-50`}
                      >
                        {booking ? "Записываю..." : "Записаться"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Done */}
                {bookingStep === "done" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check size={32} className="text-green-600" />
                    </div>
                    <p className={`text-xl font-bold ${theme.text} mb-2`}>Готово!</p>
                    <p className={`text-sm ${theme.textSecondary} mb-6`}>
                      Запись к {selected.name} подтверждена.{"\n"}Психолог ждёт тебя в назначенное время.
                    </p>
                    <button
                      onClick={() => { setSelected(null); setTab("mybookings"); loadBookings() }}
                      className={`w-full py-3 rounded-xl font-semibold text-sm ${theme.buttonBg} ${theme.buttonText}`}
                    >
                      Посмотреть запись
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
