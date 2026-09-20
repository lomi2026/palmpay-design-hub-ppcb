'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';

type Theme = 'dark' | 'light';

const themeChangeEvent = 'v9-theme-change';

function savedTheme(): Theme {
  try {
    const current = window.localStorage.getItem('ppux-theme');
    if (current === 'light' || current === 'dark') return current;

    const legacy = window.localStorage.getItem('pp-theme');
    const value = legacy ? JSON.parse(legacy) : null;
    return value === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function subscribeToThemePreference(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  return () => window.removeEventListener(themeChangeEvent, onStoreChange);
}

export function V9ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToThemePreference, savedTheme, () => 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    try {
      window.localStorage.setItem('ppux-theme', nextTheme);
      window.localStorage.setItem('pp-theme', JSON.stringify(nextTheme));
    } catch {
      // Theme preference is optional and must never block access to the public home.
    }
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <Button
      aria-label={theme === 'dark' ? '切换至浅色主题' : '切换至深色主题'}
      className="size-10 rounded-[12px] border-border bg-background text-foreground hover:bg-muted hover:text-foreground"
      onClick={toggleTheme}
      size="icon-sm"
      type="button"
      variant="outline"
    >
      {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
}
