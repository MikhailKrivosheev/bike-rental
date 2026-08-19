import { getTranslations } from 'next-intl/server';

export async function SiteFooter() {
  const t = await getTranslations('Footer');

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
        <span>{t('copyright', { year: new Date().getFullYear() })}</span>
        <span>{t('tagline')}</span>
      </div>
    </footer>
  );
}
