'use client';

import { useFormatter } from 'next-intl';

import type { Booking, BookingBike } from '@/components/booking/use-booking';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { AnimatedPrice } from '@/components/booking/animated-price';

type BookingStepsProps = {
  booking: Booking;
  bike: BookingBike;
  onCancel: () => void;
};

/** The email → code → confirmation part of the flow, shared by both entry points. */
export function BookingSteps({ booking, bike, onCancel }: BookingStepsProps) {
  const { t } = booking;
  const format = useFormatter();

  if (booking.step === 'email') {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-[17px]">{t('emailTitle')}</DialogTitle>
          <DialogDescription>{t('emailDescription')}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            booking.submitEmail();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-email" className="text-[13px]">
              {t('emailLabel')}
            </Label>
            <Input
              id="booking-email"
              type="email"
              required
              autoComplete="email"
              className="h-[38px]"
              value={booking.email}
              onChange={(event) => booking.setEmail(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-muted px-3.5 py-3 text-sm">
            <span className="text-muted-foreground">{t('total')}</span>
            <AnimatedPrice cents={booking.total} className="text-base font-semibold" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={booking.isPending}>
              {booking.isPending ? t('sending') : t('sendCode')}
            </Button>
          </DialogFooter>
        </form>
      </>
    );
  }

  if (booking.step === 'code') {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-[17px]">{t('otpTitle')}</DialogTitle>
          <DialogDescription>{t('otpDescription', { email: booking.email })}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <InputOTP
            maxLength={6}
            value={booking.code}
            onChange={booking.setCode}
            onComplete={booking.submitCode}
            disabled={booking.isPending}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => booking.submitCode(booking.code)}
            disabled={booking.isPending || booking.code.length < 6}
          >
            {booking.isPending ? t('confirming') : t('confirm')}
          </Button>
        </DialogFooter>
      </>
    );
  }

  if (booking.step === 'done' && booking.startsAt) {
    const rows = [
      { label: t('summaryBike'), value: bike.model },
      {
        label: t('summaryStart'),
        value: format.dateTime(booking.startsAt, { dateStyle: 'medium', timeStyle: 'short' }),
      },
      { label: t('summaryDuration'), value: t('hours', { hours: booking.hours }) },
    ];

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-[17px]">{t('successTitle')}</DialogTitle>
          <DialogDescription>
            {t('successDescription', { email: booking.email })}
          </DialogDescription>
        </DialogHeader>

        <dl className="flex flex-col gap-2.5 rounded-[10px] bg-muted px-3.5 py-3 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t pt-2.5">
            <dt className="text-muted-foreground">{t('summaryTotal')}</dt>
            <dd>
              <AnimatedPrice cents={booking.total} className="font-semibold" />
            </dd>
          </div>
        </dl>

        <DialogFooter>
          <Button className="w-full" onClick={onCancel}>
            {t('done')}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return null;
}
