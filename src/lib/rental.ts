/**
 * Rental pricing rules shared by the booking dialog and the server actions.
 * Add-on prices are flat per rental and in cents, like every other price in the
 * app; their ids are stored on `Rental.accessories`.
 */
export const accessories = [
  { id: 'helmet', price: 300 },
  { id: 'bottle', price: 150 },
] as const;

export type AccessoryId = (typeof accessories)[number]['id'];

export const accessoryIds = accessories.map((accessory) => accessory.id);

export function isAccessoryId(value: string): value is AccessoryId {
  return accessoryIds.includes(value as AccessoryId);
}

export function accessoriesPrice(ids: readonly string[]): number {
  return accessories
    .filter((accessory) => ids.includes(accessory.id))
    .reduce((total, accessory) => total + accessory.price, 0);
}

/** Pickup time of day for a booked date, in local hours. */
export const PICKUP_HOUR = 10;

/** Durations offered in the booking dialog, in hours. */
export const rentalDurations = [1, 2, 4, 8, 24] as const;

export type RentalDuration = (typeof rentalDurations)[number];

export function isRentalDuration(value: number): value is RentalDuration {
  return (rentalDurations as readonly number[]).includes(value);
}

export function rentalPrice(pricePerHour: number, hours: number, accessoryIds: readonly string[]) {
  return pricePerHour * hours + accessoriesPrice(accessoryIds);
}
