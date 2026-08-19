'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';

import { BookingFields } from '@/components/booking/booking-fields';
import { BookingSteps } from '@/components/booking/booking-steps';
import { BookingTotal } from '@/components/booking/booking-total';
import { type BookingBike, useBooking } from '@/components/booking/use-booking';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/format';

type BookingPanelProps = {
  bike: BookingBike;
};

/** Booking entry point on the bike page: fields sit in the sticky sidebar. */
export function BookingPanel({ bike }: BookingPanelProps) {
  const booking = useBooking(bike);
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

      <BookingFields booking={booking} bike={bike} />

      <Separator />

      <BookingTotal booking={booking} bike={bike} />

      <Button
        className="h-[42px] rounded-[9px] text-[15px]"
        disabled={!booking.canContinue}
        onClick={() => {
          booking.setStep('email');
          setOpen(true);
        }}
      >
        {translate('trigger')}
      </Button>

      <p className="text-center text-xs text-muted-foreground">{translate('cancellationNote')}</p>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <BookingSteps booking={booking} bike={bike} onCancel={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    </aside>
  );
}
