'use client';

import { useState } from 'react';

import { BookingFields } from '@/components/booking/booking-fields';
import { BookingSteps } from '@/components/booking/booking-steps';
import { BookingTotal } from '@/components/booking/booking-total';
import { type BookingBike, useBooking } from '@/components/booking/use-booking';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type BookingDialogProps = {
  bike: BookingBike;
  className?: string;
};

/** Booking entry point on a catalogue card: the whole flow lives in the dialog. */
export function BookingDialog({ bike, className }: BookingDialogProps) {
  const booking = useBooking(bike);
  const [open, setOpen] = useState(false);
  const { t } = booking;

  function onOpenChange(next: boolean) {
    setOpen(next);

    if (!next) {
      booking.finish();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className={className} onClick={(event) => event.stopPropagation()}>
          {t('trigger')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        {booking.step === 'details' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-[17px]">{t('title', { model: bike.model })}</DialogTitle>
              <DialogDescription>{t('subtitle')}</DialogDescription>
            </DialogHeader>

            <BookingFields booking={booking} bike={bike} />
            <BookingTotal booking={booking} bike={bike} plate />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={() => booking.setStep('email')} disabled={!booking.canContinue}>
                {t('continue')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <BookingSteps booking={booking} bike={bike} onCancel={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
