import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Coffee, Zap, Sparkles, BookOpen, Briefcase, Heart, Users, Download, Bell, LayoutGrid } from "lucide-react"
import Icon from "@/components/ui/icon"
import Schedule from "@/pages/Schedule"
import SectionScreen, { SectionType } from "@/pages/SectionScreen"
import WeekOverview from "@/pages/WeekOverview"
import Notifications from "@/pages/Notifications"

type Theme = "day" | "night" | "coffee" | "mint" | "electric"

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
  buttonHover: string
}> = {
  day: {
    name: "День",
    icon: Sun,
    bg: "bg-gray-50",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    border: "border-gray-200",
    accent: "text-gray-900",
    buttonBg: "bg-gray-900",
    buttonText: "text-white",
    buttonHover: "hover:bg-gray-700",
  },
  night: {
    name: "Ночь",
    icon: Moon,
    bg: "bg-gray-900",
    cardBg: "bg-gray-800",
    text: "text-gray-100",
    textSecondary: "text-gray-400",
    border: "border-gray-700",
    accent: "text-gray-100",
    buttonBg: "bg-gray-100",
    buttonText: "text-gray-900",
    buttonHover: "hover:bg-gray-300",
  },
  coffee: {
    name: "Кофе",
    icon: Coffee,
    bg: "bg-amber-50",
    cardBg: "bg-amber-100",
    text: "text-amber-900",
    textSecondary: "text-amber-700",
    border: "border-amber-200",
    accent: "text-amber-800",
    buttonBg: "bg-amber-800",
    buttonText: "text-amber-50",
    buttonHover: "hover:bg-amber-700",
  },
  mint: {
    name: "Фокус",
    icon: Sparkles,
    bg: "bg-emerald-50",
    cardBg: "bg-emerald-100",
    text: "text-emerald-900",
    textSecondary: "text-emerald-700",
    border: "border-emerald-200",
    accent: "text-emerald-800",
    buttonBg: "bg-emerald-800",
    buttonText: "text-emerald-50",
    buttonHover: "hover:bg-emerald-700",
  },
  electric: {
    name: "Электро",
    icon: Zap,
    bg: "bg-slate-900",
    cardBg: "bg-slate-800",
    text: "text-cyan-100",
    textSecondary: "text-cyan-300",
    border: "border-cyan-500",
    accent: "text-cyan-400",
    buttonBg: "bg-cyan-500",
    buttonText: "text-slate-900",
    buttonHover: "hover:bg-cyan-400",
  },
}

const appLinks = [
  {
    name: "Учёба",
    icon: BookOpen,
    description: "Расписание, дедлайны, задачи — всё под контролем",
    url: "#",
  },
  {
    name: "Работа",
    icon: Briefcase,
    description: "Смены, подработка и карьерные цели в одном месте",
    url: "#",
  },
  {
    name: "Отдых",
    icon: Heart,
    description: "Приложение напомнит восстановить силы вовремя",
    url: "#",
  },
  {
    name: "Социальная жизнь",
    icon: Users,
    description: "Время для друзей и важных встреч — без чувства вины",
    url: "#",
  },
  {
    name: "Обзор недели",
    icon: LayoutGrid,
    description: "Все сферы жизни в одном месте — баланс на ладони",
    url: "#",
  },
  {
    name: "Скачать приложение",
    icon: Download,
    description: "iOS & Android — бесплатно, без регистрации",
    url: "#",
  },
  {
    name: "Включить напоминания",
    icon: Bell,
    description: "Умные уведомления — без лишнего шума",
    url: "#",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
}

const linkVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.95,
  },
}

const themeButtonVariants = {
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.9,
    rotate: -5,
  },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return "Доброе утро"
  if (h >= 12 && h < 17) return "Добрый день"
  if (h >= 17 && h < 22) return "Добрый вечер"
  return "Доброй ночи"
}

export default function SocialLinksLanding() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("day")
  const [screen, setScreen] = useState<"home" | "schedule" | "overview" | "notifications" | SectionType>("home")
  const [name, setName] = useState<string>(() => localStorage.getItem("balance_name") || "")
  const [nameInput, setNameInput] = useState("")
  const [editingName, setEditingName] = useState(false)
  const theme = themes[currentTheme]

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    localStorage.setItem("balance_name", trimmed)
    setName(trimmed)
    setEditingName(false)
    setNameInput("")
  }

  if (screen === "schedule") {
    return <Schedule onBack={() => setScreen("home")} theme={theme} />
  }

  if (screen === "work" || screen === "rest" || screen === "social") {
    return <SectionScreen section={screen} onBack={() => setScreen("home")} theme={theme} />
  }

  if (screen === "overview") {
    return <WeekOverview onBack={() => setScreen("home")} theme={theme} />
  }

  if (screen === "notifications") {
    return <Notifications onBack={() => setScreen("home")} theme={theme} />
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${theme.bg}`}>
      {/* Theme Switcher */}
      <motion.div
        className="fixed top-4 right-4 z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className={`flex gap-2 p-2 rounded-full ${theme.cardBg} ${theme.border} border-2`}>
          {Object.entries(themes).map(([key, themeData]) => {
            const IconComponent = themeData.icon
            return (
              <motion.button
                key={key}
                onClick={() => setCurrentTheme(key as Theme)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentTheme === key
                    ? `${theme.buttonBg} ${theme.buttonText}`
                    : `${theme.text} hover:${theme.buttonBg} hover:${theme.buttonText}`
                }`}
                variants={themeButtonVariants}
                whileHover="hover"
                whileTap="tap"
                title={themeData.name}
              >
                <IconComponent size={16} />
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="container mx-auto px-4 py-16 max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Section */}
        <motion.div className="text-center mb-10" variants={itemVariants}>
          {/* Avatar */}
          <motion.div
            className={`w-24 h-24 mx-auto mb-5 rounded-full ${theme.cardBg} ${theme.border} border-4 flex items-center justify-center cursor-pointer`}
            whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
            onClick={() => { setEditingName(true); setNameInput(name) }}
            title="Нажми, чтобы изменить имя"
          >
            <motion.div
              className={`w-16 h-16 rounded-full ${theme.buttonBg} flex items-center justify-center`}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className={`text-2xl font-bold ${theme.buttonText}`}>
                {name ? name[0].toUpperCase() : "B"}
              </span>
            </motion.div>
          </motion.div>

          {/* Greeting or name input */}
          <AnimatePresence mode="wait">
            {editingName || !name ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4"
              >
                <p className={`text-sm ${theme.textSecondary} mb-2`}>
                  {name ? "Изменить имя" : "Как тебя зовут?"}
                </p>
                <div className="flex gap-2 max-w-xs mx-auto">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveName()}
                    placeholder="Введи имя..."
                    className={`flex-1 px-4 py-2 rounded-lg ${theme.cardBg} ${theme.border} border ${theme.text} text-sm outline-none text-center`}
                  />
                  <button
                    onClick={saveName}
                    className={`px-4 py-2 rounded-lg ${theme.buttonBg} ${theme.buttonText} text-sm font-semibold`}
                  >
                    ОК
                  </button>
                </div>
                {name && (
                  <button onClick={() => setEditingName(false)} className={`mt-2 text-xs ${theme.textSecondary} underline`}>
                    Отмена
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4"
              >
                <motion.p className={`text-sm ${theme.textSecondary} mb-1`} variants={itemVariants}>
                  {getGreeting()},
                </motion.p>
                <motion.h1
                  className={`text-3xl font-bold ${theme.text}`}
                  variants={itemVariants}
                >
                  {name}!
                </motion.h1>
                <button
                  onClick={() => { setEditingName(true); setNameInput(name) }}
                  className={`mt-1 text-xs ${theme.textSecondary} opacity-50 hover:opacity-100 transition-opacity`}
                >
                  изменить имя
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p className={`${theme.textSecondary} text-sm`} variants={itemVariants}>
            Учёба. Работа. Отдых. Жизнь.
          </motion.p>
        </motion.div>

        {/* App Links */}
        <motion.div className="space-y-4" variants={containerVariants}>
          <AnimatePresence>
            {appLinks.map((link) => {
              const IconComponent = link.icon
              return (
                <motion.a
                  key={link.name}
                  href={link.url}
                  className={`block w-full p-4 rounded-lg ${theme.cardBg} ${theme.border} border-2 transition-all duration-200 group cursor-pointer`}
                  onClick={() => {
                    if (link.name === "Учёба") setScreen("schedule")
                    if (link.name === "Работа") setScreen("work")
                    if (link.name === "Отдых") setScreen("rest")
                    if (link.name === "Социальная жизнь") setScreen("social")
                    if (link.name === "Обзор недели") setScreen("overview")
                    if (link.name === "Включить напоминания") setScreen("notifications")
                  }}
                  variants={linkVariants}
                  whileHover="hover"
                  whileTap="tap"
                  layout
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className={`p-2 rounded-full ${theme.buttonBg} ${theme.buttonText}`}
                        whileHover={{ rotate: 15 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <IconComponent size={20} />
                      </motion.div>
                      <div>
                        <h3 className={`font-semibold ${theme.text}`}>{link.name}</h3>
                        <p className={`text-sm ${theme.textSecondary}`}>{link.description}</p>
                      </div>
                    </div>
                    <motion.div
                      className={`${theme.accent}`}
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Icon name="ChevronRight" size={20} />
                    </motion.div>
                  </div>
                </motion.a>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className={`mt-8 p-4 rounded-lg ${theme.cardBg} ${theme.border} border-2`}
          variants={itemVariants}
        >
          <div className="flex justify-around text-center">
            <div>
              <p className={`text-2xl font-bold ${theme.text}`}>4</p>
              <p className={`text-xs ${theme.textSecondary}`}>сферы жизни</p>
            </div>
            <div className={`w-px ${theme.border} border-l`} />
            <div>
              <p className={`text-2xl font-bold ${theme.text}`}>1</p>
              <p className={`text-xs ${theme.textSecondary}`}>приложение</p>
            </div>
            <div className={`w-px ${theme.border} border-l`} />
            <div>
              <p className={`text-2xl font-bold ${theme.text}`}>0</p>
              <p className={`text-xs ${theme.textSecondary}`}>стресса</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div className="text-center mt-12" variants={itemVariants}>
          <motion.p
            className={`text-sm ${theme.textSecondary}`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Balance — твой личный планировщик жизни
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 ${theme.buttonBg} rounded-full opacity-20`}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}