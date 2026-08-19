'use client';

import { useState } from 'react';

import { Fields } from 'Components/booking/fields';
import { Steps } from 'Components/booking/steps';
import { Total } from 'Components/booking/total';
import { useBooking } from 'Components/booking/hooks/use-booking';
import type { DialogProps } from 'Components/booking/types';
import { Button } from 'Components/ui/button';
import {
  // The shadcn primitive keeps its own name so this file can export `Dialog`.
  Dialog as DialogRoot,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'Components/ui/dialog';

/** Booking entry point on a catalogue card: the whole flow lives in the dialog. */
export function Dialog({ bike, className }: DialogProps) {
  const booking = useBooking(bike);
  const [open, setOpen] = useState(false);
  const { translate } = booking;

  function onOpenChange(next: boolean) {
    setOpen(next);

    if (!next) {
      booking.finish();
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className={className} onClick={(event) => event.stopPropagation()}>
          {translate('trigger')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        {booking.step === 'details' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-[17px]">{translate('title', { model: bike.model })}</DialogTitle>
              <DialogDescription>{translate('subtitle')}</DialogDescription>
            </DialogHeader>

            <Fields booking={booking} bike={bike} />
            <Total booking={booking} bike={bike} plate />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {translate('cancel')}
              </Button>
              <Button onClick={() => booking.setStep('email')} disabled={!booking.canContinue}>
                {translate('continue')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Steps booking={booking} bike={bike} onCancel={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </DialogRoot>
  );
}
