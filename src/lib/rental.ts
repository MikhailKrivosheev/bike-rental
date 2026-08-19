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

/** Rentals last between one hour and a full day. */
export const MIN_HOURS = 1;
export const MAX_HOURS = 24;
export const DEFAULT_HOURS = 3;

/** Opening hours of the stations — pickup times are offered within this range. */
export const OPENS_AT = 8;
export const CLOSES_AT = 23;

export const pickupTimes = Array.from({ length: CLOSES_AT - OPENS_AT }, (_, index) =>
  `${String(OPENS_AT + index).padStart(2, '0')}:00`,
);

export function clampHours(hours: number) {
  return Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(hours)));
}

export function rentalPrice(pricePerHour: number, hours: number, accessoryIds: readonly string[]) {
  return pricePerHour * hours + accessoriesPrice(accessoryIds);
}
