'use client';

import { RiGlobalLine } from '@remixicon/react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getPathname, usePathname } from '@/i18n/navigation';
import { localeLabels, locales, type Locale } from '@/i18n/routing';

export function LocaleSwitcher() {
  const translate = useTranslations('Header');
  const activeLocale = useLocale();
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);

  function selectLocale(locale: Locale) {
    setIsPending(true);

    // A full navigation rather than router.replace: switching locale swaps the
    // [locale] segment, and a client-side remount of the root layout would make
    // React re-render the next-themes bootstrap script (which it never runs).
    // `pathname` is locale-agnostic here, so the same page opens in the new locale.
    window.location.assign(getPathname({ href: pathname, locale }));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={translate('language')} disabled={isPending}>
          <RiGlobalLine className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => selectLocale(locale)}
            disabled={locale === activeLocale}
          >
            {localeLabels[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
