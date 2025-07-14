"use client"

import { useEffect, useState, useCallback } from "react"
import { create } from "@/lib/store"
import { persist, createJSONStorage } from "@/lib/store"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

export interface UseThemeProps {
  themes: Theme[]
  setTheme: (theme: Theme) => void
  theme: Theme
  resolvedTheme: ResolvedTheme
}

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

const defaultThemes: Theme[] = ["light", "dark"]

export const useTheme = (): UseThemeProps => {
  const { theme, setTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light")

  const applyTheme = useCallback((newTheme: Theme) => {
    const d = document.documentElement
    let resolved: ResolvedTheme

    if (newTheme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    } else {
      resolved = newTheme
    }

    d.classList.remove("light", "dark")
    d.classList.add(resolved)
    d.setAttribute("data-theme", resolved)
    d.style.colorScheme = resolved
    setResolvedTheme(resolved)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  useEffect(() => {
    const handleMediaQuery = () => {
      if (useThemeStore.getStore().theme === "system") {
        applyTheme("system")
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        try {
          const newTheme = JSON.parse(e.newValue).store.theme as Theme
          setTheme(newTheme)
        } catch (error) {
          console.error("Failed to parse theme from storage", error)
        }
      }
    }

    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQueryList.addEventListener("change", handleMediaQuery)
    window.addEventListener("storage", handleStorage)
    setMounted(true)

    return () => {
      mediaQueryList.removeEventListener("change", handleMediaQuery)
      window.removeEventListener("storage", handleStorage)
    }
  }, [applyTheme, setTheme])

  return {
    theme,
    setTheme,
    themes: [...defaultThemes, "system"],
    resolvedTheme: mounted ? resolvedTheme : "light",
  }
}
