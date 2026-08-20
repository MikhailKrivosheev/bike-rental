'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';

import { Fields } from 'Components/booking/fields';
import { Steps } from 'Components/booking/steps';
import { Total } from 'Components/booking/total';
import { useBooking } from 'Components/booking/hooks/use-booking';
import type { PanelProps } from 'Components/booking/types';
import { Button } from 'Components/ui/button';
import { Dialog as DialogRoot, DialogContent } from 'Components/ui/dialog';
import { Separator } from 'Components/ui/separator';
import { formatPrice } from 'Lib/format';

/** Booking entry point on the bike page: fields sit in the sticky sidebar. */
export function Panel({ bike, userEmail }: PanelProps) {
  const booking = useBooking(bike, userEmail);
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const { translate } = booking;

  function onOpenChange(next: boolean) {
    setOpen(next);

    if (!next) {
      booking.finish();
    }
  }

  return (
    <aside className="top-24 flex flex-col gap-4 rounded-2xl border p-[22px] lg:sticky">
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-semibold tracking-[-0.02em]">
            {formatPrice(bike.pricePerHour, locale)}
          </span>
          <span className="text-sm text-muted-foreground">{translate('perHourShort')}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatPrice(bike.pricePerDay, locale)} {translate('perDayShort')}
        </span>
      </div>

      <Separator />

      <Fields booking={booking} bike={bike} />

      <Separator />

      <Total booking={booking} bike={bike} />

      <Button
        className="h-[42px] rounded-[9px] text-[15px]"
        disabled={!booking.canContinue}
        onClick={() => {
          setOpen(true);

          if (userEmail) {
            booking.book();
          } else {
            booking.setStep('email');
          }
        }}
      >
        {translate('trigger')}
      </Button>

      <p className="text-center text-xs text-muted-foreground">{translate('cancellationNote')}</p>

      <DialogRoot open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <Steps booking={booking} bike={bike} onCancel={() => onOpenChange(false)} />
        </DialogContent>
      </DialogRoot>
    </aside>
  );
}
