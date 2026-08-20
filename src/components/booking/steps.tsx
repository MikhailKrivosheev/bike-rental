'use client';

import { useFormatter } from 'next-intl';

import { CODE_LENGTH, CODE_SLOTS } from 'Components/booking/constants';
import type { StepsProps } from 'Components/booking/types';
import { Button } from 'Components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'Components/ui/dialog';
import { Input } from 'Components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from 'Components/ui/input-otp';
import { Label } from 'Components/ui/label';
import { AnimatedPrice } from 'Components/booking/animated-price';

export function Steps({ booking, bike, onCancel }: StepsProps) {
  const { translate } = booking;
  const format = useFormatter();

  if (booking.step === 'email') {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-[17px]">{translate('emailTitle')}</DialogTitle>
          <DialogDescription>{translate('emailDescription')}</DialogDescription>
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
              {translate('emailLabel')}
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
            <span className="text-muted-foreground">{translate('total')}</span>
            <AnimatedPrice cents={booking.total} className="text-base font-semibold" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              {translate('cancel')}
            </Button>
            <Button type="submit" disabled={booking.isPending}>
              {booking.isPending ? translate('sending') : translate('sendCode')}
            </Button>
          </DialogFooter>
        </form>
      </>
    );
  }

  if (booking.step === 'confirming') {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <span className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <p className="text-sm text-muted-foreground">{translate('confirming')}</p>
      </div>
    );
  }

  if (booking.step === 'code') {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-[17px]">{translate('otpTitle')}</DialogTitle>
          <DialogDescription>{translate('otpDescription', { email: booking.email })}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <InputOTP
            maxLength={CODE_LENGTH}
            value={booking.code}
            onChange={booking.setCode}
            onComplete={booking.submitCode}
            disabled={booking.isPending}
          >
            <InputOTPGroup>
              {CODE_SLOTS.map((index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {translate('cancel')}
          </Button>
          <Button
            onClick={() => booking.submitCode(booking.code)}
            disabled={booking.isPending || booking.code.length < CODE_LENGTH}
          >
            {booking.isPending ? translate('confirming') : translate('confirm')}
          </Button>
        </DialogFooter>
      </>
    );
  }

  if (booking.step === 'summary' && booking.startsAt) {
    const rows = [
      { label: translate('summaryBike'), value: bike.model },
      {
        label: translate('summaryStart'),
        value: format.dateTime(booking.startsAt, { dateStyle: 'medium', timeStyle: 'short' }),
      },
      {
        label: translate('summaryDuration'),
        value:
          booking.quote.unit === 'day'
            ? translate('days', { days: booking.quote.units })
            : translate('hours', { hours: booking.quote.units }),
      },
      { label: translate('summaryEmail'), value: booking.email },
    ];

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-[17px]">{translate('payTitle')}</DialogTitle>
          <DialogDescription>{translate('payDescription')}</DialogDescription>
        </DialogHeader>

        <dl className="flex flex-col gap-2.5 rounded-[10px] bg-muted px-3.5 py-3 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t pt-2.5">
            <dt className="text-muted-foreground">{translate('summaryTotal')}</dt>
            <dd>
              <AnimatedPrice cents={booking.total} className="font-semibold" />
            </dd>
          </div>
        </dl>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {translate('cancel')}
          </Button>
          <Button onClick={booking.pay} disabled={booking.isPending}>
            {booking.isPending ? translate('paying') : translate('payButton')}
          </Button>
        </DialogFooter>
      </>
    );
  }

  if (booking.step === 'done' && booking.startsAt) {
    const rows = [
      { label: translate('summaryBike'), value: bike.model },
      {
        label: translate('summaryStart'),
        value: format.dateTime(booking.startsAt, { dateStyle: 'medium', timeStyle: 'short' }),
      },
      {
        label: translate('summaryDuration'),
        value:
          booking.quote.unit === 'day'
            ? translate('days', { days: booking.quote.units })
            : translate('hours', { hours: booking.quote.units }),
      },
    ];

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-[17px]">{translate('successTitle')}</DialogTitle>
          <DialogDescription>
            {translate('successDescription', { email: booking.email })}
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
            <dt className="text-muted-foreground">{translate('summaryTotal')}</dt>
            <dd>
              <AnimatedPrice cents={booking.total} className="font-semibold" />
            </dd>
          </div>
        </dl>

        <DialogFooter>
          <Button className="w-full" onClick={onCancel}>
            {translate('done')}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return null;
}
