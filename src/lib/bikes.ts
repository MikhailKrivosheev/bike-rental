import { BikeType } from '@/generated/prisma/enums';

export const bikeTypeLabels: Record<BikeType, string> = {
  [BikeType.GRAVEL]: 'Gravel',
  [BikeType.MTB]: 'Mountain',
  [BikeType.CITY]: 'City',
};
