'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { DEFAULT_HOURS, clampHours, pickupTimes, rentalPrice } from '@/lib/rental';
import { confirmBooking, createBooking } from '@/server/booking';

export type BookingBike = {
  id: string;
  model: string;
  pricePerHour: number;
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
  const t = useTranslations('Booking');
  const router = useRouter();

  const [step, setStep] = useState<BookingStep>('details');
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState(pickupTimes[2] ?? pickupTimes[0]);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [accessories, setAccessories] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [rentalId, setRentalId] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(
    () => rentalPrice(bike.pricePerHour, hours, accessories),
    [bike.pricePerHour, hours, accessories],
  );

  function reset() {
    setStep('details');
    setDate(undefined);
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
    if (!date) {
      return;
    }

    startTransition(async () => {
      const result = await createBooking({
        bikeId: bike.id,
        date: toDateInput(date),
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
    t,
    step,
    setStep,
    date,
    setDate,
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
    total,
    isPending,
    canContinue: Boolean(date),
    submitEmail,
    submitCode,
    finish,
  };
}

export type Booking = ReturnType<typeof useBooking>;
