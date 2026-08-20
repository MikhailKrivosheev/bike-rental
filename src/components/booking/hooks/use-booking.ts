"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useReducer, useTransition } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import {
  DEFAULT_HOURS,
  clampHours,
  daysBetween,
  pickupTimes,
  quoteRental,
} from "Lib/rental";
import type { BookingBike, BookingStep } from "Components/booking/types";
import { confirmBooking, createBooking, payBooking } from "@/server/booking";

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
  hours: number;
  accessories: string[];
  email: string;
  code: string;
  rentalId: string | null;
  startsAt: Date | null;
};

function initialState(): BookingState {
  return {
    step: "details",
    range: undefined,
    time: pickupTimes[2] ?? pickupTimes[0],
    hours: DEFAULT_HOURS,
    accessories: [],
    email: "",
    code: "",
    rentalId: null,
    startsAt: null,
  };
}

type BookingAction =
  | { type: "reset" }
  | { type: "setStep"; step: BookingStep }
  | { type: "setRange"; range: DateRange | undefined }
  | { type: "setTime"; time: string }
  | { type: "setHours"; hours: number }
  | { type: "toggleAccessory"; id: string; checked: boolean }
  | { type: "setEmail"; email: string }
  | { type: "setCode"; code: string }
  | { type: "emailSubmitted"; rentalId: string }
  | { type: "codeConfirmed"; startsAt: Date }
  | { type: "paid" };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "reset":
      return initialState();
    case "setStep":
      return { ...state, step: action.step };
    case "setRange":
      return { ...state, range: action.range };
    case "setTime":
      return { ...state, time: action.time };
    case "setHours":
      return { ...state, hours: clampHours(action.hours) };
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
    case "codeConfirmed":
      return { ...state, startsAt: action.startsAt, step: "summary" };
    case "paid":
      return { ...state, step: "done" };
  }
}

export function useBooking(bike: BookingBike) {
  const translate = useTranslations("Booking");
  const locale = useLocale();
  const router = useRouter();

  const [state, dispatch] = useReducer(bookingReducer, undefined, initialState);
  const [isPending, startTransition] = useTransition();

  const { step, range, time, hours, accessories, email, code, rentalId, startsAt } = state;

  const days = range?.from && range.to ? daysBetween(range.from, range.to) : 0;

  const quote = useMemo(
    () => quoteRental(bike, { days, hours, accessories }),
    [bike, days, hours, accessories],
  );

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
          hours,
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
    dispatch({ type: "reset" });
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
    hours,
    setHours: (value: number) => dispatch({ type: "setHours", hours: value }),
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
    submitCode,
    pay,
    finish,
  };
}
