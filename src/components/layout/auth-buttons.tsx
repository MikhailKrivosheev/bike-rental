'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from 'Components/ui/button';

/**
 * Placeholders from the design: there is no auth yet, so both buttons only
 * say so. Replace with real navigation once accounts exist.
 */
export function AuthButtons() {
  const translate = useTranslations('Header');

  return (
    <div className="hidden items-center gap-2.5 sm:flex">
      <Button variant="outline" className="h-9 px-3.5" onClick={() => toast(translate('comingSoon'))}>
        {translate('myBookings')}
      </Button>
      <Button className="h-9 px-3.5" onClick={() => toast(translate('comingSoon'))}>
        {translate('signIn')}
      </Button>
    </div>
  );
}
