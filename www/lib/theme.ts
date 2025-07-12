"use client"

import { useEffect, useState, useCallback } from "react"
import { create, persist, createJSONStorage } from "@/lib/store"

type Theme = string
type ResolvedTheme = string

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const useThemeStore = create<ThemeStore>(
  persist(
    (setStore) => ({
      theme: "system",
      setTheme: (theme: any) => setStore({ theme }),
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
    }
  ) as any
)

export const useTheme = () => {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light")
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useThemeStore()

  const applyTheme = useCallback((themeToApply: Theme) => {
    let newResolvedTheme: ResolvedTheme
    const d = document.documentElement

    if (themeToApply === "system") {
      newResolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    } else {
      newResolvedTheme = themeToApply
    }

    d.dataset.theme = newResolvedTheme

    if (newResolvedTheme === "light" || newResolvedTheme === "dark") {
      d.style.colorScheme = newResolvedTheme
    } else {
      d.style.colorScheme = ""
    }

    setResolvedTheme(newResolvedTheme)
  }, [])

  useEffect(() => {
    applyTheme(theme)

    const mediaListener = () => {
      if (useThemeStore.getStore().theme === "system") {
        applyTheme("system")
      }
    }
    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQueryList.addEventListener("change", mediaListener)

    setMounted(true)

    return () => mediaQueryList.removeEventListener("change", mediaListener)
  }, [theme, applyTheme])

  return {
    theme,
    setTheme,
    resolvedTheme: mounted ? resolvedTheme : undefined,
    mounted,
  }
}
