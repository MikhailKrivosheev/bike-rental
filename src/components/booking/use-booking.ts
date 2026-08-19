'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import { DEFAULT_HOURS, clampHours, daysBetween, pickupTimes, quoteRental } from '@/lib/rental';
import { confirmBooking, createBooking } from '@/server/booking';

export type BookingBike = {
  id: string;
  model: string;
  pricePerHour: number;
  pricePerDay: number;
  stationName: string;
};

export type BookingStep = 'details' | 'email' | 'code' | 'done';

/** `2026-08-20` in the renter's own timezone, which is what the server expects. */
function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function useBooking(bike: BookingBike) {
  const translate = useTranslations('Booking');
  const router = useRouter();

  const [step, setStep] = useState<BookingStep>('details');
  const [range, setRange] = useState<DateRange | undefined>();
  const [time, setTime] = useState(pickupTimes[2] ?? pickupTimes[0]);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [accessories, setAccessories] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [rentalId, setRentalId] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  // A single picked day is charged by the hour, a range of days by the day.
  const days = range?.from && range.to ? daysBetween(range.from, range.to) : 0;

  const quote = useMemo(
    () => quoteRental(bike, { days, hours, accessories }),
    [bike, days, hours, accessories],
  );

  function reset() {
    setStep('details');
    setRange(undefined);
    setTime(pickupTimes[2] ?? pickupTimes[0]);
    setHours(DEFAULT_HOURS);
    setAccessories([]);
    setEmail('');
    setCode('');
    setRentalId(null);
    setStartsAt(null);
  }

  function toggleAccessory(id: string, checked: boolean) {
    setAccessories((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  }

  function submitEmail() {
    if (!range?.from) {
      return;
    }

    startTransition(async () => {
      const result = await createBooking({
        bikeId: bike.id,
        date: toDateInput(range.from as Date),
        endDate: days > 0 && range.to ? toDateInput(range.to) : undefined,
        time,
        hours,
        accessories,
        email,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setRentalId(result.rentalId);
      setStep('code');
    });
  }

  function submitCode(value: string) {
    if (!rentalId) {
      return;
    }

    startTransition(async () => {
      const result = await confirmBooking(rentalId, value);

      if (!result.ok) {
        toast.error(result.error);
        setCode('');
        return;
      }

      setStartsAt(new Date(result.startsAt));
      setStep('done');
    });
  }

  /** Called when the flow closes, so a completed booking shows up in the catalogue. */
  function finish() {
    if (step === 'done') {
      router.refresh();
    }
    reset();
  }

  return {
    translate,
    step,
    setStep,
    range,
    setRange,
    days,
    time,
    setTime,
    hours,
    setHours: (value: number) => setHours(clampHours(value)),
    accessories,
    toggleAccessory,
    email,
    setEmail,
    code,
    setCode,
    startsAt,
    quote,
    total: quote.total,
    isPending,
    canContinue: Boolean(range?.from),
    submitEmail,
    submitCode,
    finish,
  };
}

export type Booking = ReturnType<typeof useBooking>;
