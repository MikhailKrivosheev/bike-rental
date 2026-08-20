import type { useBooking } from 'Components/booking/hooks/use-booking';

export type BookingBike = {
  id: string;
  model: string;
  pricePerHour: number;
  pricePerDay: number;
  stationName: string;
};

export type BookingStep = 'details' | 'email' | 'code' | 'summary' | 'done';

export type Booking = ReturnType<typeof useBooking>;

export type AnimatedPriceProps = {
  cents: number;
  className?: string;
};

export type DialogProps = {
  bike: BookingBike;
  className?: string;
  isSignedIn: boolean;
};

export type FieldsProps = {
  booking: Booking;
  bike: BookingBike;
};

export type PanelProps = {
  bike: BookingBike;
  isSignedIn: boolean;
};

export type StepsProps = {
  booking: Booking;
  bike: BookingBike;
  onCancel: () => void;
};

export type TotalProps = {
  booking: Booking;
  bike: BookingBike;
  /** The dialog puts the summary on a muted plate; the sidebar keeps it flat. */
  plate?: boolean;
};
