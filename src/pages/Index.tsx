import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Coffee, Zap, Sparkles, BookOpen, Briefcase, Heart, Users, LayoutGrid, User, Home, ChevronRight } from "lucide-react"
import Schedule from "@/pages/Schedule"
import SectionScreen, { SectionType } from "@/pages/SectionScreen"
import WeekOverview from "@/pages/WeekOverview"
import Notifications from "@/pages/Notifications"
import Profile from "@/pages/Profile"

type Theme = "day" | "night" | "coffee" | "mint" | "electric"
type Tab = "home" | "schedule" | "overview" | "profile"
type SubScreen = SectionType | "notifications" | null

const themes: Record<Theme, {
  name: string
  icon: typeof Sun
  bg: string
  cardBg: string
  text: string
  textSecondary: string
  border: string
  accent: string
  buttonBg: string
  buttonText: string
}> = {
  day: {
    name: "День", icon: Sun,
    bg: "bg-gray-50", cardBg: "bg-white",
    text: "text-gray-900", textSecondary: "text-gray-500",
    border: "border-gray-200", accent: "text-gray-900",
    buttonBg: "bg-gray-900", buttonText: "text-white",
  },
  night: {
    name: "Ночь", icon: Moon,
    bg: "bg-gray-900", cardBg: "bg-gray-800",
    text: "text-gray-100", textSecondary: "text-gray-400",
    border: "border-gray-700", accent: "text-gray-100",
    buttonBg: "bg-gray-100", buttonText: "text-gray-900",
  },
  coffee: {
    name: "Кофе", icon: Coffee,
    bg: "bg-amber-50", cardBg: "bg-amber-100",
    text: "text-amber-900", textSecondary: "text-amber-700",
    border: "border-amber-200", accent: "text-amber-800",
    buttonBg: "bg-amber-800", buttonText: "text-amber-50",
  },
  mint: {
    name: "Фокус", icon: Sparkles,
    bg: "bg-emerald-50", cardBg: "bg-emerald-100",
    text: "text-emerald-900", textSecondary: "text-emerald-700",
    border: "border-emerald-200", accent: "text-emerald-800",
    buttonBg: "bg-emerald-800", buttonText: "text-emerald-50",
  },
  electric: {
    name: "Электро", icon: Zap,
    bg: "bg-slate-900", cardBg: "bg-slate-800",
    text: "text-cyan-100", textSecondary: "text-cyan-300",
    border: "border-cyan-500", accent: "text-cyan-400",
    buttonBg: "bg-cyan-500", buttonText: "text-slate-900",
  },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return "Доброе утро"
  if (h >= 12 && h < 17) return "Добрый день"
  if (h >= 17 && h < 22) return "Добрый вечер"
  return "Доброй ночи"
}

const SECTIONS = [
  { key: "schedule" as const, label: "Учёба", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100", desc: "Пары, дедлайны, задачи" },
  { key: "work" as SectionType, label: "Работа", icon: Briefcase, color: "text-amber-600", bg: "bg-amber-100", desc: "Смены и карьера" },
  { key: "rest" as SectionType, label: "Отдых", icon: Heart, color: "text-pink-600", bg: "bg-pink-100", desc: "Спорт и восстановление" },
  { key: "social" as SectionType, label: "Соцжизнь", icon: Users, color: "text-purple-600", bg: "bg-purple-100", desc: "Друзья и мероприятия" },
]

const NAV_TABS = [
  { key: "home" as Tab, label: "Главная", icon: Home },
  { key: "schedule" as Tab, label: "Расписание", icon: BookOpen },
  { key: "overview" as Tab, label: "Обзор", icon: LayoutGrid },
  { key: "profile" as Tab, label: "Профиль", icon: User },
]

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("day")
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [subScreen, setSubScreen] = useState<SubScreen>(null)
  const theme = themes[currentTheme]
  const name = localStorage.getItem("balance_name") || ""

  // Sub-screens (slide over tabs)
  if (subScreen === "notifications") {
    return (
      <div className={`h-screen flex flex-col ${theme.bg}`}>
        <Notifications onBack={() => setSubScreen(null)} theme={theme} />
      </div>
    )
  }
  if (subScreen === "work" || subScreen === "rest" || subScreen === "social") {
    return (
      <div className={`h-screen flex flex-col ${theme.bg}`}>
        <SectionScreen section={subScreen} onBack={() => setSubScreen(null)} theme={theme} />
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col ${theme.bg} overflow-hidden`}>
      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* HOME TAB */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="px-4 pt-14 pb-6"
            >
              {/* Greeting */}
              <div className="mb-8">
                <p className={`text-sm ${theme.textSecondary}`}>{getGreeting()}{name ? "," : "!"}</p>
                <h1 className={`text-3xl font-bold mt-0.5 ${theme.text}`}>
                  {name ? `${name}!` : "Balance"}
                </h1>
                <p className={`text-sm mt-1 ${theme.textSecondary}`}>Что планируем сегодня?</p>
              </div>

              {/* Section cards 2x2 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {SECTIONS.map(s => {
                  const IconComp = s.icon
                  return (
                    <motion.button
                      key={s.key}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        if (s.key === "schedule") setActiveTab("schedule")
                        else setSubScreen(s.key as SectionType)
                      }}
                      className={`${theme.cardBg} ${theme.border} border rounded-2xl p-4 text-left`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                        <IconComp size={20} className={s.color} />
                      </div>
                      <p className={`font-semibold text-sm ${theme.text}`}>{s.label}</p>
                      <p className={`text-xs mt-0.5 ${theme.textSecondary}`}>{s.desc}</p>
                    </motion.button>
                  )
                })}
              </div>

              {/* Quick links */}
              <div className={`rounded-2xl ${theme.cardBg} ${theme.border} border overflow-hidden`}>
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b ${theme.border} active:opacity-70`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <LayoutGrid size={15} className="text-indigo-600" />
                  </div>
                  <p className={`flex-1 text-sm font-medium text-left ${theme.text}`}>Обзор недели</p>
                  <ChevronRight size={15} className={theme.textSecondary} />
                </button>
                <button
                  onClick={() => setSubScreen("notifications")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70`}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-sm">🔔</span>
                  </div>
                  <p className={`flex-1 text-sm font-medium text-left ${theme.text}`}>Напоминания</p>
                  <ChevronRight size={15} className={theme.textSecondary} />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Schedule onBack={() => setActiveTab("home")} theme={theme} hideBack />
            </motion.div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <WeekOverview onBack={() => setActiveTab("home")} theme={theme} hideBack />
            </motion.div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              <Profile
                theme={theme}
                currentTheme={currentTheme}
                onThemeChange={setCurrentTheme}
                onOpenNotifications={() => setSubScreen("notifications")}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar */}
      <div className={`shrink-0 ${theme.cardBg} border-t ${theme.border} flex items-center px-2 pb-safe`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
      >
        {NAV_TABS.map(tab => {
          const IconComp = tab.icon
          const isActive = activeTab === tab.key
          return (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileTap={{ scale: 0.9 }}
              className="flex-1 flex flex-col items-center gap-1 py-3"
            >
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <IconComp
                  size={22}
                  className={isActive ? theme.accent : theme.textSecondary}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </motion.div>
              <span className={`text-xs font-medium ${isActive ? theme.text : theme.textSecondary}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className={`absolute bottom-0 w-8 h-0.5 rounded-full ${theme.buttonBg}`}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
