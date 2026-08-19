'use client';

import { RiCalendarLine, RiSubtractLine, RiAddLine } from '@remixicon/react';
import { enUS, pt } from 'date-fns/locale';
import { useFormatter, useLocale } from 'next-intl';
import { useMemo } from 'react';

import type { Booking, BookingBike } from '@/components/booking/hooks/use-booking';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MAX_DAYS, MAX_HOURS, MIN_HOURS, accessories, pickupTimes } from '@/lib/rental';

const dateFnsLocales = { en: enUS, pt } as const;

type FieldsProps = {
  booking: Booking;
  bike: BookingBike;
};

export function Fields({ booking, bike }: FieldsProps) {
  const { translate } = booking;
  const locale = useLocale();
  const format = useFormatter();

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  const { from, to } = booking.range ?? {};

  const label = from
    ? booking.days > 0 && to
      ? `${format.dateTime(from, { dateStyle: 'medium' })} – ${format.dateTime(to, { dateStyle: 'medium' })}`
      : format.dateTime(from, { dateStyle: 'long' })
    : translate('pickDate');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-[13px]">{translate('date')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-[38px] justify-start font-normal">
              <RiCalendarLine className="size-4 text-muted-foreground" />
              {label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={booking.range}
              onSelect={booking.setRange}
              disabled={{ before: today }}
              max={MAX_DAYS + 1}
              locale={dateFnsLocales[locale as keyof typeof dateFnsLocales] ?? enUS}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          {booking.days > 0 ? translate('days', { days: booking.days }) : translate('rangeHint')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="booking-time" className="text-[13px]">
          {translate('time')}
        </Label>
        <Select value={booking.time} onValueChange={booking.setTime}>
          <SelectTrigger id="booking-time" className="!h-[38px] w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pickupTimes.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {booking.days === 0 ? (
        <div className="flex flex-col gap-2">
          <Label className="text-[13px]">{translate('duration')}</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-[38px] shrink-0"
              aria-label={translate('decrease')}
              disabled={booking.hours <= MIN_HOURS}
              onClick={() => booking.setHours(booking.hours - 1)}
            >
              <RiSubtractLine className="size-4" />
            </Button>
            <div
              aria-live="polite"
              className="flex h-[38px] flex-1 items-center justify-center rounded-lg border text-sm font-medium"
            >
              {translate('hours', { hours: booking.hours })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-[38px] shrink-0"
              aria-label={translate('increase')}
              disabled={booking.hours >= MAX_HOURS}
              onClick={() => booking.setHours(booking.hours + 1)}
            >
              <RiAddLine className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label className="text-[13px]">{translate('pickupPoint')}</Label>
        {/* Bikes live at a station, so the pickup point follows the bike. */}
        <div className="flex h-[38px] items-center rounded-lg border bg-muted/40 px-3 text-sm">
          {bike.stationName}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 text-[13px] font-medium">{translate('accessories')}</legend>
        {accessories.map((accessory) => (
          <div key={accessory.id} className="flex items-center gap-3">
            <Checkbox
              id={`accessory-${accessory.id}`}
              checked={booking.accessories.includes(accessory.id)}
              onCheckedChange={(checked) => booking.toggleAccessory(accessory.id, checked === true)}
            />
            <Label htmlFor={`accessory-${accessory.id}`} className="flex-1 font-normal">
              {translate(`accessory.${accessory.id}`)}
            </Label>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              +{format.number(accessory.price / 100, { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        ))}
      </fieldset>
    </div>
  );
}
