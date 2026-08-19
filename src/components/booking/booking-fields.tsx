'use client';

import { RiCalendarLine, RiSubtractLine, RiAddLine } from '@remixicon/react';
import { enUS, pt } from 'date-fns/locale';
import { useFormatter, useLocale } from 'next-intl';
import { useMemo } from 'react';

import type { Booking, BookingBike } from '@/components/booking/use-booking';
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
import { MAX_HOURS, MIN_HOURS, accessories, pickupTimes } from '@/lib/rental';

const dateFnsLocales = { en: enUS, pt } as const;

type BookingFieldsProps = {
  booking: Booking;
  bike: BookingBike;
};

export function BookingFields({ booking, bike }: BookingFieldsProps) {
  const { t } = booking;
  const locale = useLocale();
  const format = useFormatter();

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-[13px]">{t('date')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-[38px] justify-start font-normal">
              <RiCalendarLine className="size-4 text-muted-foreground" />
              {booking.date
                ? format.dateTime(booking.date, { dateStyle: 'long' })
                : t('pickDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={booking.date}
              onSelect={booking.setDate}
              disabled={{ before: today }}
              locale={dateFnsLocales[locale as keyof typeof dateFnsLocales] ?? enUS}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="booking-time" className="text-[13px]">
          {t('time')}
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

      <div className="flex flex-col gap-2">
        <Label className="text-[13px]">{t('duration')}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-[38px] shrink-0"
            aria-label={t('decrease')}
            disabled={booking.hours <= MIN_HOURS}
            onClick={() => booking.setHours(booking.hours - 1)}
          >
            <RiSubtractLine className="size-4" />
          </Button>
          <div
            aria-live="polite"
            className="flex h-[38px] flex-1 items-center justify-center rounded-lg border text-sm font-medium"
          >
            {t('hours', { hours: booking.hours })}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-[38px] shrink-0"
            aria-label={t('increase')}
            disabled={booking.hours >= MAX_HOURS}
            onClick={() => booking.setHours(booking.hours + 1)}
          >
            <RiAddLine className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-[13px]">{t('pickupPoint')}</Label>
        {/* Bikes live at a station, so the pickup point follows the bike. */}
        <div className="flex h-[38px] items-center rounded-lg border bg-muted/40 px-3 text-sm">
          {bike.stationName}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 text-[13px] font-medium">{t('accessories')}</legend>
        {accessories.map((accessory) => (
          <div key={accessory.id} className="flex items-center gap-3">
            <Checkbox
              id={`accessory-${accessory.id}`}
              checked={booking.accessories.includes(accessory.id)}
              onCheckedChange={(checked) => booking.toggleAccessory(accessory.id, checked === true)}
            />
            <Label htmlFor={`accessory-${accessory.id}`} className="flex-1 font-normal">
              {t(`accessory.${accessory.id}`)}
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
