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

/** Opening hours of the stations — pickup times are offered within this range. */
export const OPENS_AT = 8;
export const CLOSES_AT = 23;

export const pickupTimes = Array.from(
  { length: CLOSES_AT - OPENS_AT },
  (_, index) => `${String(OPENS_AT + index).padStart(2, '0')}:00`,
);

export function clampHours(hours: number) {
  return Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(hours)));
}

/** `"14:00"` → `14`. Pickup times are always `HH:00`, so this is safe. */
export function hourOf(time: string) {
  return Number(time.slice(0, 2));
}

export function hoursBetween(startTime: string, endTime: string) {
  return hourOf(endTime) - hourOf(startTime);
}

/** The next pickup slot after `time`, or the last one if `time` is already the last. */
export function nextPickupTime(time: string) {
  const index = pickupTimes.indexOf(time);
  return pickupTimes[Math.min(index + 1, pickupTimes.length - 1)] ?? time;
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
    total: unitPrice * units + addOns,
  };
}
