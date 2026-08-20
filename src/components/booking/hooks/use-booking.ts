"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useState, useTransition } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import {
  CHECKOUT_TIME,
  DEFAULT_HOURS,
  atTimeOfDay,
  clampHours,
  daysBetween,
  hoursBetween,
  minutesOf,
  nextPickupTime,
  pickupTimeAfterHours,
  pickupTimes,
  quoteRental,
} from "Lib/rental";
import type { BookingBike, BookingStep } from "Components/booking/types";
import { confirmBooking, createBooking, getBikeBookedRanges, payBooking } from "@/server/booking";

export type BookedRange = { start: Date; end: Date };

/** `2026-08-20` in the renter's own timezone, which is what the server expects. */
function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

type BookingState = {
  step: BookingStep;
  range: DateRange | undefined;
  time: string;
  endTime: string;
  accessories: string[];
  email: string;
  code: string;
  rentalId: string | null;
  startsAt: Date | null;
};

function initialState(userEmail: string | null = null): BookingState {
  const time = pickupTimes[2] ?? pickupTimes[0];

  return {
    step: "details",
    range: undefined,
    time,
    endTime: pickupTimeAfterHours(time, DEFAULT_HOURS),
    accessories: [],
    email: userEmail ?? "",
    code: "",
    rentalId: null,
    startsAt: null,
  };
}

type BookingAction =
  | { type: "reset"; userEmail: string | null }
  | { type: "setStep"; step: BookingStep }
  | { type: "setRange"; range: DateRange | undefined }
  | { type: "setTime"; time: string }
  | { type: "setEndTime"; endTime: string }
  | { type: "toggleAccessory"; id: string; checked: boolean }
  | { type: "setEmail"; email: string }
  | { type: "setCode"; code: string }
  | { type: "emailSubmitted"; rentalId: string }
  | { type: "bookingConfirmed"; rentalId: string; startsAt: Date }
  | { type: "codeConfirmed"; startsAt: Date }
  | { type: "paid" };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "reset":
      return initialState(action.userEmail);
    case "setStep":
      return { ...state, step: action.step };
    case "setRange": {
      const days =
        action.range?.from && action.range.to ? daysBetween(action.range.from, action.range.to) : 0;
      // Multi-day rentals return at a fixed checkout time — see CHECKOUT_TIME.
      return { ...state, range: action.range, endTime: days > 0 ? CHECKOUT_TIME : state.endTime };
    }
    case "setTime": {
      const time = action.time;
      // Keep the range non-empty when the start slides past the current end.
      const endTime = minutesOf(state.endTime) > minutesOf(time) ? state.endTime : nextPickupTime(time);
      return { ...state, time, endTime };
    }
    case "setEndTime":
      return minutesOf(action.endTime) > minutesOf(state.time)
        ? { ...state, endTime: action.endTime }
        : state;
    case "toggleAccessory":
      return {
        ...state,
        accessories: action.checked
          ? [...state.accessories, action.id]
          : state.accessories.filter((value) => value !== action.id),
      };
    case "setEmail":
      return { ...state, email: action.email };
    case "setCode":
      return { ...state, code: action.code };
    case "emailSubmitted":
      return { ...state, rentalId: action.rentalId, step: "code" };
    case "bookingConfirmed":
      return { ...state, rentalId: action.rentalId, startsAt: action.startsAt, step: "summary" };
    case "codeConfirmed":
      return { ...state, startsAt: action.startsAt, step: "summary" };
    case "paid":
      return { ...state, step: "done" };
  }
}

export function useBooking(bike: BookingBike, userEmail: string | null = null) {
  const translate = useTranslations("Booking");
  const locale = useLocale();
  const router = useRouter();

  const [state, dispatch] = useReducer(bookingReducer, userEmail, initialState);
  const [isPending, startTransition] = useTransition();
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);

  const { step, range, time, endTime, accessories, email, code, rentalId, startsAt } = state;

  const days = range?.from && range.to ? daysBetween(range.from, range.to) : 0;
  const hours = clampHours(hoursBetween(time, endTime));

  const quote = useMemo(
    () => quoteRental(bike, { days, hours, accessories }),
    [bike, days, hours, accessories],
  );

  async function refreshAvailability() {
    const ranges = await getBikeBookedRanges(bike.id);
    setBookedRanges(ranges.map((range) => ({ start: new Date(range.startsAt), end: new Date(range.endsAt) })));
  }

  // Bookings made by other visitors while this dialog sits open shouldn't be
  // shown as free, so this refreshes whenever the flow starts a fresh attempt.
  useEffect(() => {
    if (step === "details") {
      refreshAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bike.id, step]);

  // A previously picked (or default) start slot can turn out to already be
  // taken — by another visitor, or by this same bike on a re-opened dialog —
  // so this nudges the selection to the next free slot instead of leaving an
  // unbookable time silently selected.
  useEffect(() => {
    if (days !== 0 || !range?.from) {
      return;
    }

    const day = range.from;
    const isToday = day.toDateString() === new Date().toDateString();
    const isTaken = (candidateTime: string) => {
      const candidate = atTimeOfDay(day, candidateTime);
      return bookedRanges.some((booked) => booked.start <= candidate && booked.end > candidate);
    };
    const isPast = (candidateTime: string) => {
      if (!isToday) {
        return false;
      }
      return atTimeOfDay(day, candidateTime) <= new Date();
    };

    if (!isTaken(time) && !isPast(time)) {
      return;
    }

    const free = pickupTimes.find((candidateTime) => !isTaken(candidateTime) && !isPast(candidateTime));
    if (free && free !== time) {
      dispatch({ type: "setTime", time: free });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookedRanges, range?.from, days]);

  function toggleAccessory(id: string, checked: boolean) {
    dispatch({ type: "toggleAccessory", id, checked });
  }

  function submitEmail() {
    if (!range?.from) {
      return;
    }

    startTransition(async () => {
      const result = await createBooking(
        {
          bikeId: bike.id,
          date: toDateInput(range.from as Date),
          endDate: days > 0 && range.to ? toDateInput(range.to) : undefined,
          time,
          endTime,
          accessories,
          email,
        },
        locale,
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      dispatch({ type: "emailSubmitted", rentalId: result.rentalId });
    });
  }

  /** Signed-in visitors already proved their email at login, so this skips straight past the email/OTP steps. */
  function book() {
    if (!range?.from || !userEmail) {
      return;
    }

    dispatch({ type: "setStep", step: "confirming" });

    startTransition(async () => {
      const result = await createBooking(
        {
          bikeId: bike.id,
          date: toDateInput(range.from as Date),
          endDate: days > 0 && range.to ? toDateInput(range.to) : undefined,
          time,
          endTime,
          accessories,
          email: userEmail,
        },
        locale,
      );

      if (!result.ok) {
        toast.error(result.error);
        dispatch({ type: "setStep", step: "details" });
        return;
      }

      if (result.confirmed) {
        dispatch({
          type: "bookingConfirmed",
          rentalId: result.rentalId,
          startsAt: new Date(result.startsAt),
        });
      } else {
        dispatch({ type: "emailSubmitted", rentalId: result.rentalId });
      }
    });
  }

  function submitCode(value: string) {
    if (!rentalId) {
      return;
    }

    startTransition(async () => {
      const result = await confirmBooking(rentalId, value, locale);

      if (!result.ok) {
        toast.error(result.error);
        dispatch({ type: "setCode", code: "" });
        return;
      }

      dispatch({ type: "codeConfirmed", startsAt: new Date(result.startsAt) });
    });
  }

  function pay() {
    if (!rentalId) {
      return;
    }

    startTransition(async () => {
      const result = await payBooking(rentalId, locale);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      dispatch({ type: "paid" });
    });
  }

  function finish() {
    if (step === "done") {
      router.refresh();
    }
    dispatch({ type: "reset", userEmail });
  }

  return {
    translate,
    step,
    setStep: (value: BookingStep) => dispatch({ type: "setStep", step: value }),
    range,
    setRange: (value: DateRange | undefined) => dispatch({ type: "setRange", range: value }),
    days,
    time,
    setTime: (value: string) => dispatch({ type: "setTime", time: value }),
    endTime,
    setEndTime: (value: string) => dispatch({ type: "setEndTime", endTime: value }),
    hours,
    bookedRanges,
    accessories,
    toggleAccessory,
    email,
    setEmail: (value: string) => dispatch({ type: "setEmail", email: value }),
    code,
    setCode: (value: string) => dispatch({ type: "setCode", code: value }),
    startsAt,
    quote,
    total: quote.total,
    isPending,
    canContinue: Boolean(range?.from),
    submitEmail,
    book,
    submitCode,
    pay,
    finish,
  };
}
