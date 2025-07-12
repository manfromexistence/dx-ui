"use client";

import React from "react";

const themeScript = `
(function() {
  try {
    const theme = localStorage.getItem('theme') || 'system';
    const d = document.documentElement;

    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolvedTheme = isDark ? 'dark' : 'light';
      d.dataset.theme = resolvedTheme;
      d.style.colorScheme = resolvedTheme;
    } else {
      d.dataset.theme = theme;
      if (theme === 'light' || theme === 'dark') {
         d.style.colorScheme = theme;
      }
    }
  } catch (e) {}
})();
`;

export const Dx = () => {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};
