'use client';

import { RiCalendarLine } from '@remixicon/react';
import { enUS } from 'date-fns/locale';
import { useFormatter, useLocale } from 'next-intl';
import { useMemo, useState } from 'react';

import { dateFnsLocales } from 'Components/booking/constants';
import type { FieldsProps } from 'Components/booking/types';
import { Button } from 'Components/ui/button';
import { Calendar } from 'Components/ui/calendar';
import { Checkbox } from 'Components/ui/checkbox';
import { Label } from 'Components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from 'Components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'Components/ui/select';
import { CLOSES_AT, MAX_DAYS, OPENS_AT, accessories, pickupTimes } from 'Lib/rental';

function atLocalHour(day: Date, time: string) {
  const result = new Date(day);
  result.setHours(Number(time.slice(0, 2)), 0, 0, 0);
  return result;
}

export function Fields({ booking, bike }: FieldsProps) {
  const { translate } = booking;
  const locale = useLocale();
  const format = useFormatter();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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

  /** True once every hourly slot from opening to closing on `day` falls inside a booked window. */
  function isFullyBooked(day: Date) {
    for (let hour = OPENS_AT; hour < CLOSES_AT; hour += 1) {
      const slotStart = new Date(day);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(day);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      const covered = booking.bookedRanges.some(
        (range) => range.start <= slotStart && range.end >= slotEnd,
      );

      if (!covered) {
        return false;
      }
    }
    return true;
  }

  function isPartiallyBooked(day: Date) {
    const dayStart = new Date(day);
    dayStart.setHours(OPENS_AT, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(CLOSES_AT, 0, 0, 0);

    return booking.bookedRanges.some((range) => range.start < dayEnd && range.end > dayStart);
  }

  /** Whether the given pickup instant on the current start day has already passed. */
  function isTimePast(time: string) {
    if (!from || from.getTime() !== today.getTime()) {
      return false;
    }
    return atLocalHour(from, time) <= new Date();
  }

  /** Whether the given pickup instant on the current start day already belongs to a booked rental. */
  function isTimeTaken(time: string) {
    if (!from) {
      return false;
    }
    const candidate = atLocalHour(from, time);
    return booking.bookedRanges.some((range) => range.start <= candidate && range.end > candidate);
  }

  /** Whether picking `endTime` on the return day would overlap a booked rental. */
  function isEndTimeBlocked(endTime: string) {
    if (!from) {
      return false;
    }
    const rangeStart = atLocalHour(from, booking.time);
    const rangeEnd = atLocalHour(to ?? from, endTime);
    return booking.bookedRanges.some((range) => range.start < rangeEnd && range.end > rangeStart);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-[13px]">{translate('date')}</Label>
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
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
              disabled={[{ before: today }, isFullyBooked]}
              modifiers={{ partiallyBooked: isPartiallyBooked }}
              modifiersClassNames={{ partiallyBooked: 'after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-destructive' }}
              max={MAX_DAYS + 1}
              locale={dateFnsLocales[locale as keyof typeof dateFnsLocales] ?? enUS}
              autoFocus
            />
            <Button
              type="button"
              className="mx-2.5 mb-2.5"
              disabled={!from}
              onClick={() => setIsDatePickerOpen(false)}
            >
              {translate('pick')}
            </Button>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          {booking.days > 0 ? translate('days', { days: booking.days }) : translate('rangeHint')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-[13px]">{translate('duration')}</Label>
        <div className="grid grid-cols-2 gap-2">
          <Select value={booking.time} onValueChange={booking.setTime}>
            <SelectTrigger aria-label={translate('time')} className="!h-[38px] w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pickupTimes.map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                  disabled={(booking.days === 0 && isTimeTaken(value)) || isTimePast(value)}
                >
                  {value}
                  {booking.days === 0 && isTimeTaken(value) ? ` — ${translate('slotTaken')}` : ''}
                  {isTimePast(value) ? ` — ${translate('slotPast')}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={booking.endTime} onValueChange={booking.setEndTime}>
            <SelectTrigger aria-label={translate('endTime')} className="!h-[38px] w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pickupTimes
                .filter((value) => booking.days > 0 || value > booking.time)
                .map((value) => (
                  <SelectItem key={value} value={value} disabled={isEndTimeBlocked(value)}>
                    {value}
                    {isEndTimeBlocked(value) ? ` — ${translate('slotTaken')}` : ''}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
