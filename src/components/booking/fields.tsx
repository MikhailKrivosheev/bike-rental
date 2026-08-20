'use client';

import { RiCalendarLine } from '@remixicon/react';
import { format as formatDate } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useFormatter, useLocale } from 'next-intl';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

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
import { CHECKOUT_TIME, MAX_DAYS, accessories, atTimeOfDay, pickupTimes } from 'Lib/rental';

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
  const dateFnsLocale = dateFnsLocales[locale as keyof typeof dateFnsLocales] ?? enUS;

  // `from`/`to` are calendar days picked in the browser's local time, not
  // instants — formatting them by local Y/M/D (via date-fns) instead of
  // through a timezone-aware formatter keeps the displayed day in sync with
  // the day the user actually clicked, regardless of server timezone.
  const label = from
    ? booking.days > 0 && to
      ? `${formatDate(from, 'PP', { locale: dateFnsLocale })} – ${formatDate(to, 'PP', { locale: dateFnsLocale })}`
      : formatDate(from, 'PPP', { locale: dateFnsLocale })
    : translate('pickDate');

  /** True once every hour-wide opening slot on `day` falls inside a booked window. */
  function isFullyBooked(day: Date) {
    return pickupTimes.every((slot) => {
      const slotStart = atTimeOfDay(day, slot);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      return booking.bookedRanges.some((range) => range.start <= slotStart && range.end >= slotEnd);
    });
  }

  function isPartiallyBooked(day: Date) {
    return pickupTimes.some((slot) => {
      const slotStart = atTimeOfDay(day, slot);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      return booking.bookedRanges.some((range) => range.start < slotEnd && range.end > slotStart);
    });
  }

  /**
   * For a multi-day range, every day strictly between the pickup and return
   * day belongs to the renter in full — so any existing booking there (even
   * a partial one) makes the whole range unbookable, regardless of which
   * pickup/return hours get picked afterwards.
   */
  function hasInteriorConflict(range: DateRange) {
    if (!range.from || !range.to) {
      return false;
    }

    const cursor = new Date(range.from);
    cursor.setDate(cursor.getDate() + 1);

    while (cursor < range.to) {
      if (isPartiallyBooked(cursor)) {
        return true;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return false;
  }

  function handleRangeSelect(range: DateRange | undefined) {
    if (range?.from && range.to && range.from.getTime() !== range.to.getTime() && hasInteriorConflict(range)) {
      toast.error(translate('rangeBlocked'));
      return;
    }
    booking.setRange(range);
  }

  /** Whether the given pickup instant on the current start day has already passed. */
  function isTimePast(time: string) {
    if (!from || from.getTime() !== today.getTime()) {
      return false;
    }
    return atTimeOfDay(from, time) <= new Date();
  }

  /** Whether the given pickup instant on the current start day already belongs to a booked rental. */
  function isTimeTaken(time: string) {
    if (!from) {
      return false;
    }
    const candidate = atTimeOfDay(from, time);
    return booking.bookedRanges.some((range) => range.start <= candidate && range.end > candidate);
  }

  /** Whether picking `endTime` on the return day would overlap a booked rental. */
  function isEndTimeBlocked(endTime: string) {
    if (!from) {
      return false;
    }
    const rangeStart = atTimeOfDay(from, booking.time);
    const rangeEnd = atTimeOfDay(to ?? from, endTime);
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
              onSelect={handleRangeSelect}
              disabled={[{ before: today }, isFullyBooked]}
              modifiers={{ partiallyBooked: isPartiallyBooked }}
              modifiersClassNames={{ partiallyBooked: 'after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-destructive' }}
              max={MAX_DAYS + 1}
              locale={dateFnsLocale}
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
                  disabled={isTimeTaken(value) || isTimePast(value)}
                >
                  {value}
                  {isTimeTaken(value) ? ` — ${translate('slotTaken')}` : ''}
                  {isTimePast(value) ? ` — ${translate('slotPast')}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {booking.days > 0 ? (
            <div
              aria-label={translate('endTime')}
              className="flex h-[38px] items-center justify-between rounded-lg border bg-muted/40 px-3 text-sm"
            >
              <span className="text-muted-foreground">{translate('endTime')}</span>
              <span className="tabular-nums">{booking.endTime}</span>
            </div>
          ) : (
            <Select value={booking.endTime} onValueChange={booking.setEndTime}>
              <SelectTrigger aria-label={translate('endTime')} className="!h-[38px] w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pickupTimes
                  .filter((value) => value > booking.time)
                  .map((value) => (
                    <SelectItem key={value} value={value} disabled={isEndTimeBlocked(value)}>
                      {value}
                      {isEndTimeBlocked(value) ? ` — ${translate('slotTaken')}` : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {booking.days > 0 ? (
          <p className="text-xs text-muted-foreground">
            {translate('checkoutHint', { time: CHECKOUT_TIME })}
          </p>
        ) : null}
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
