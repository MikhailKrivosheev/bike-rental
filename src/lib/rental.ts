/**
 * Rental pricing rules shared by the booking UI and the server actions.
 * Add-on prices are flat per rental and in cents, like every other price in the
 * app; their ids are stored on `Rental.accessories`.
 */
export const accessories = [
  { id: 'helmet', price: 300 },
  { id: 'bottle', price: 150 },
] as const;

export type AccessoryId = (typeof accessories)[number]['id'];

export const accessoryIds = accessories.map((accessory) => accessory.id);

export function accessoriesPrice(ids: readonly string[]): number {
  return accessories
    .filter((accessory) => ids.includes(accessory.id))
    .reduce((total, accessory) => total + accessory.price, 0);
}

/** Hourly rentals last between one hour and a full day. */
export const MIN_HOURS = 1;
export const MAX_HOURS = 24;
export const DEFAULT_HOURS = 3;

/** Rentals may run for at most a fortnight. */
export const MAX_DAYS = 14;

/** The stations close for lunch, so opening hours are two separate windows. */
export type BusinessWindow = { start: string; end: string };

export const BUSINESS_HOURS: readonly BusinessWindow[] = [
  { start: '09:00', end: '13:00' },
  { start: '14:30', end: '19:30' },
];

/** `"14:30"` → `870`. Lets times be compared and stepped without hard-coding `HH:00`. */
export function minutesOf(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Every hour-wide pickup/return slot across both opening windows, in order. */
export const pickupTimes = BUSINESS_HOURS.flatMap((window) => {
  const slots: string[] = [];
  for (let minute = minutesOf(window.start); minute < minutesOf(window.end); minute += 60) {
    slots.push(formatMinutes(minute));
  }
  return slots;
});

/**
 * The fixed return time for multi-day rentals — like a hotel checkout. Without
 * it, a range booked 09:00 on day one to 19:30 on the last day would use the
 * bike for nearly a full extra day while only being billed per calendar day.
 */
export const CHECKOUT_TIME = pickupTimes[0];

// Pickup/return slots fall on the hour or the half-hour, so hours are never
// rounded here — rounding up would bill for time the renter didn't take.
export function clampHours(hours: number) {
  return Math.min(MAX_HOURS, Math.max(MIN_HOURS, hours));
}

export function hoursBetween(startTime: string, endTime: string) {
  return (minutesOf(endTime) - minutesOf(startTime)) / 60;
}

/** The next pickup slot after `time`, or the last one if `time` is already the last. */
export function nextPickupTime(time: string) {
  const index = pickupTimes.indexOf(time);
  return pickupTimes[Math.min(index + 1, pickupTimes.length - 1)] ?? time;
}

/** The next slot at least `hours` after `time`, clamped to the last slot of the day. */
export function pickupTimeAfterHours(time: string, hours: number) {
  const target = minutesOf(time) + hours * 60;
  return pickupTimes.find((candidate) => minutesOf(candidate) >= target) ?? pickupTimes[pickupTimes.length - 1];
}

/** `time` ("HH:MM") applied to `date`'s year/month/day, in the local timezone. */
export function atTimeOfDay(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole days between two picked dates. A bike collected on the 1st and returned
 * on the 5th is out for four 24-hour days, so the end date is exclusive.
 */
export function daysBetween(from: Date, to: Date) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

export type RentalPrices = {
  pricePerHour: number;
  pricePerDay: number;
};

export type RentalQuote = {
  /** A single picked day is charged by the hour, a range by the day. */
  unit: 'hour' | 'day';
  units: number;
  unitPrice: number;
  accessories: number;
  total: number;
};

export function quoteRental(
  prices: RentalPrices,
  options: { days?: number; hours: number; accessories: readonly string[] },
): RentalQuote {
  const days = options.days ?? 0;
  // A full 24-hour picked without a date range is a calendar day, so it
  // should get the day rate rather than 24× the hourly one.
  const isFullDayByHours = days === 0 && options.hours >= MAX_HOURS;
  const unit = days > 0 || isFullDayByHours ? 'day' : 'hour';
  const units = unit === 'day' ? days || 1 : options.hours;
  const unitPrice = unit === 'day' ? prices.pricePerDay : prices.pricePerHour;
  const addOns = accessoriesPrice(options.accessories);

  return {
    unit,
    units,
    unitPrice,
    accessories: addOns,
    // units can be a half hour, so round to the nearest cent rather than
    // letting a fractional-cent price leak into the total.
    total: Math.round(unitPrice * units) + addOns,
  };
}
