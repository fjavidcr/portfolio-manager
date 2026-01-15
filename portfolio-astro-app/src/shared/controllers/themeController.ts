import { auth, db } from '@shared/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export const STORAGE_KEY_COLOR = 'color_theme'
export const STORAGE_KEY_MODE = 'theme_mode'

export type ThemeColor = 'default' | 'blue' | 'green' | 'purple' | 'retro' | 'bumblebee'
export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  color: ThemeColor
  mode: ThemeMode
}

export const getThemePreferences = (): ThemeState => {
  if (typeof localStorage === 'undefined') return { color: 'default', mode: 'system' }
  const color = (localStorage.getItem(STORAGE_KEY_COLOR) as ThemeColor) || 'default'
  const mode = (localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode) || 'system'
  return { color, mode }
}

// Subscription System
const listeners: Array<() => void> = []

export const subscribe = (listener: () => void) => {
  listeners.push(listener)
  return () => {
    const index = listeners.indexOf(listener)
    if (index > -1) listeners.splice(index, 1)
  }
}

const notify = () => {
  listeners.forEach((listener) => listener())
}

export const applyTheme = () => {
  if (typeof window === 'undefined') return

  const { color, mode } = getThemePreferences()
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'system' && sysDark)
  const fullTheme = `${color}-${isDark ? 'dark' : 'light'}`

  document.documentElement.setAttribute('data-theme', fullTheme)
  document.documentElement.classList.toggle('dark', isDark)

  console.log(`Theme Applied: ${fullTheme} (Mode: ${mode})`)
}

export const syncThemeToFirestore = async () => {
  const user = auth.currentUser
  if (!user) return

  const { color, mode } = getThemePreferences()

  try {
    const userThemeRef = doc(db, 'users', user.uid, 'settings', 'theme')
    await setDoc(userThemeRef, { color, mode }, { merge: true })
    console.log('Theme synced to Firestore', { color, mode })
  } catch (e) {
    console.error('Error syncing theme to Firestore:', e)
  }
}

export const setThemeColor = (color: string) => {
  localStorage.setItem(STORAGE_KEY_COLOR, color)
  applyTheme()
  syncThemeToFirestore()
  notify()
}

export const setThemeMode = (mode: string) => {
  localStorage.setItem(STORAGE_KEY_MODE, mode)
  applyTheme()
  syncThemeToFirestore()
  notify()
}

export const cycleThemeMode = () => {
  const { mode } = getThemePreferences()
  let next: ThemeMode = 'system'
  if (mode === 'system') next = 'light'
  else if (mode === 'light') next = 'dark'
  else if (mode === 'dark') next = 'system'

  setThemeMode(next)
  return next
}

// Initialize listeners
let initialized = false
export const initThemeListeners = (callbacks?: { onUpdate?: () => void }) => {
  if (typeof window === 'undefined') return
  if (initialized) return
  initialized = true

  // Apply initially
  applyTheme()
  callbacks?.onUpdate?.()

  // Sync with other tabs
  window.addEventListener('storage', () => {
    applyTheme()
    callbacks?.onUpdate?.()
    notify()
  })

  // Sync with system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { mode } = getThemePreferences()
    if (mode === 'system') {
      applyTheme()
      notify()
    }
  })

  // Auth State Listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userThemeRef = doc(db, 'users', user.uid, 'settings', 'theme')
        const snapshot = await getDoc(userThemeRef)
        if (snapshot.exists()) {
          const data = snapshot.data()
          if (data.color) localStorage.setItem(STORAGE_KEY_COLOR, data.color)
          if (data.mode) localStorage.setItem(STORAGE_KEY_MODE, data.mode)
          console.log('Theme loaded from Firestore', data)
          applyTheme()
          callbacks?.onUpdate?.()
          notify()
        } else {
          syncThemeToFirestore()
        }
      } catch (e) {
        console.error('Error fetching theme from Firestore:', e)
      }
    }
  })
}
