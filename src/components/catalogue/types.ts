import type { CSSProperties } from 'react';

export type CardModel = {
  id: string;
  model: string;
  type: string;
  typeLabel: string;
  description: string;
  specs: string[];
  price: number;
  priceLabel: string;
  pricePerDay: number;
  pricePerDayLabel: string;
  imageUrl: string | null;
  stationName: string;
  isAvailable: boolean;
  availabilityLabel: string;
};

export type CardProps = {
  bike: CardModel;
  perHourLabel: string;
  perDayLabel: string;
  bookedLabel: string;
  userEmail: string | null;
  className?: string;
  style?: CSSProperties;
};

export type Filter = {
  value: string;
  label: string;
};

export type GridProps = {
  bikes: CardModel[];
  filters: Filter[];
  userEmail: string | null;
};
