"use client"

import React from "react"

const themeScript = `
(function() {
  try {
    const storageKey = 'theme';
    const defaultTheme = 'system';
    const d = document.documentElement;
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)');

    function getTheme() {
      let LsTheme;
      try {
        LsTheme = localStorage.getItem(storageKey);
      } catch (e) {}

      if (LsTheme) {
        try {
          return JSON.parse(LsTheme).store.theme;
        } catch (e) {}
      }
      
      return defaultTheme;
    }

    function updateDOM(theme) {
      let resolvedTheme = theme;
      if (theme === 'system') {
        resolvedTheme = preferDark.matches ? 'dark' : 'light';
      }
      
      d.classList.remove('light', 'dark');
      d.classList.add(resolvedTheme);
      d.setAttribute('data-theme', resolvedTheme);
      d.style.colorScheme = resolvedTheme;
    }

    const savedTheme = getTheme();
    updateDOM(savedTheme);

  } catch (e) {}
})();
`

export const Dx = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </>
  )
}
