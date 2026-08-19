'use client';

import { RiMoonLine, RiSunLine } from '@remixicon/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const t = useTranslations('Header');

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('toggleTheme')}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <RiSunLine className="size-4 dark:hidden" />
      <RiMoonLine className="hidden size-4 dark:block" />
    </Button>
  );
}
