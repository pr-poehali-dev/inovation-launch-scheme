import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, Palette, ChevronRight, Sun, Moon, Coffee, Zap, Sparkles } from "lucide-react"

type Theme = "day" | "night" | "coffee" | "mint" | "electric"

const THEME_LABELS: Record<Theme, string> = {
  day: "Светлая",
  night: "Тёмная",
  coffee: "Кофе",
  mint: "Фокус",
  electric: "Электро",
}

const THEME_ICONS: Record<Theme, typeof Sun> = {
  day: Sun,
  night: Moon,
  coffee: Coffee,
  mint: Sparkles,
  electric: Zap,
}

const THEME_COLORS: Record<Theme, string> = {
  day: "bg-gray-200",
  night: "bg-gray-800",
  coffee: "bg-amber-400",
  mint: "bg-emerald-400",
  electric: "bg-cyan-400",
}

interface ThemeProps {
  bg: string; cardBg: string; text: string; textSecondary: string
  border: string; buttonBg: string; buttonText: string
}

interface Props {
  theme: ThemeProps
  currentTheme: Theme
  onThemeChange: (t: Theme) => void
  onOpenNotifications: () => void
}

export default function Profile({ theme, currentTheme, onThemeChange, onOpenNotifications }: Props) {
  const [name, setName] = useState(() => localStorage.getItem("balance_name") || "")
  const [nameInput, setNameInput] = useState(name)
  const [editing, setEditing] = useState(!name)
  const [saved, setSaved] = useState(false)

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    localStorage.setItem("balance_name", trimmed)
    setName(trimmed)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const initial = name ? name[0].toUpperCase() : "?"

  return (
    <div className={`flex-1 overflow-y-auto pb-6`}>
      {/* Header */}
      <div className={`px-4 pt-12 pb-6 text-center ${theme.cardBg} border-b ${theme.border}`}>
        <motion.div
          className={`w-20 h-20 mx-auto mb-4 rounded-full ${theme.buttonBg} flex items-center justify-center`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className={`text-3xl font-bold ${theme.buttonText}`}>{initial}</span>
        </motion.div>

        {editing ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className={`text-sm ${theme.textSecondary}`}>Как тебя зовут?</p>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()}
              placeholder="Введи имя..."
              className={`w-full max-w-xs mx-auto block px-4 py-2 rounded-xl ${theme.bg} ${theme.border} border ${theme.text} text-sm outline-none text-center`}
            />
            <button
              onClick={saveName}
              disabled={!nameInput.trim()}
              className={`px-8 py-2 rounded-xl font-semibold text-sm ${theme.buttonBg} ${theme.buttonText} disabled:opacity-40`}
            >
              Сохранить
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className={`text-2xl font-bold ${theme.text}`}>{name}</h2>
            {saved && <p className="text-xs text-green-500 mt-1">Сохранено!</p>}
            <button
              onClick={() => { setEditing(true); setNameInput(name) }}
              className={`mt-1 text-xs ${theme.textSecondary} underline opacity-60 hover:opacity-100`}
            >
              изменить имя
            </button>
          </motion.div>
        )}
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Theme picker */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={14} className={theme.textSecondary} />
            <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary}`}>Тема оформления</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(THEME_LABELS) as Theme[]).map(t => {
              const IconComp = THEME_ICONS[t]
              return (
                <motion.button
                  key={t}
                  onClick={() => onThemeChange(t)}
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                    currentTheme === t ? `${theme.border} ${theme.cardBg}` : "border-transparent"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${THEME_COLORS[t]} flex items-center justify-center`}>
                    <IconComp size={14} className={t === "night" ? "text-white" : "text-gray-800"} />
                  </div>
                  <span className={`text-xs ${currentTheme === t ? theme.text : theme.textSecondary}`}>
                    {THEME_LABELS[t]}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Settings links */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary}`}>Настройки</p>
          </div>
          <div className={`rounded-2xl ${theme.cardBg} ${theme.border} border overflow-hidden`}>
            <button
              onClick={onOpenNotifications}
              className={`w-full flex items-center gap-3 px-4 py-4 border-b ${theme.border} active:opacity-70 transition-opacity`}
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                <Bell size={16} className="text-pink-600" />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${theme.text}`}>Напоминания</p>
                <p className={`text-xs ${theme.textSecondary}`}>Уведомления о событиях и отдыхе</p>
              </div>
              <ChevronRight size={16} className={theme.textSecondary} />
            </button>

            <div className={`w-full flex items-center gap-3 px-4 py-4`}>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-base">🎓</span>
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${theme.text}`}>Balance for Students</p>
                <p className={`text-xs ${theme.textSecondary}`}>Версия 1.0 · Учёба, работа, жизнь</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`rounded-2xl ${theme.cardBg} ${theme.border} border p-4`}>
          <p className={`text-xs font-bold uppercase tracking-widest ${theme.textSecondary} mb-3`}>Мой профиль</p>
          <div className="flex justify-around text-center">
            <div>
              <p className={`text-xl font-bold ${theme.text}`}>4</p>
              <p className={`text-xs ${theme.textSecondary}`}>сферы</p>
            </div>
            <div className={`w-px ${theme.border} border-l`} />
            <div>
              <p className={`text-xl font-bold ${theme.text}`}>∞</p>
              <p className={`text-xs ${theme.textSecondary}`}>баланс</p>
            </div>
            <div className={`w-px ${theme.border} border-l`} />
            <div>
              <p className={`text-xl font-bold ${theme.text}`}>0</p>
              <p className={`text-xs ${theme.textSecondary}`}>стресса</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
