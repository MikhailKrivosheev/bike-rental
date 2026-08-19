import { getTranslations } from 'next-intl/server';

import { LocaleSwitcher } from '@/components/locale-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Link } from '@/i18n/navigation';

export async function Header() {
  const translate = await getTranslations('Header');

  const links = [
    { href: '/#catalogue', label: translate('catalogue') },
    { href: '/#how-it-works', label: translate('howItWorks') },
    { href: '/#pickup-points', label: translate('pickupPoints') },
  ];

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {translate('brandInitial')}
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">{translate('brand')}</span>
        </Link>

        <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
