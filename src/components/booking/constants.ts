import { enUS, pt } from 'date-fns/locale';

/** The calendar takes a date-fns locale, so map the app locales onto one. */
export const dateFnsLocales = { en: enUS, pt } as const;

export const ANIMATED_PRICE_CLASS = 'tabular-nums transition-colors duration-200';

/** While the counter is still running the amount is highlighted. */
export const ANIMATED_PRICE_RUNNING_CLASS = 'text-primary';

export const TOTAL_CLASS = 'flex items-center justify-between gap-4 text-sm';

export const TOTAL_PLATE_CLASS = 'rounded-[10px] bg-muted px-3.5 py-3';

/** The six OTP slots of a verification code. */
export const CODE_SLOTS = [0, 1, 2, 3, 4, 5];

export const CODE_LENGTH = 6;
