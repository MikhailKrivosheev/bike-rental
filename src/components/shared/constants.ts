import { cva } from 'class-variance-authority';

/** Every band of the page lines its content up on the same column and gutters. */
export const CONTAINER_CLASS = 'mx-auto w-full max-w-[1180px] px-6';

/** Anchor targets need room under the sticky header when scrolled to. */
export const SECTION_ANCHORED_CLASS = 'scroll-mt-20';

// Vertical rhythm is a shared scale rather than per-page numbers, so sections
// stacked on one page keep an even beat. `top` and `bottom` are set apart
// because the first and last section of a page need a different lead-in.
export const sectionVariants = cva('', {
  variants: {
    top: {
      none: '',
      sm: 'pt-6',
      md: 'pt-8',
      lg: 'pt-10',
      xl: 'pt-16',
    },
    bottom: {
      none: '',
      sm: 'pb-6',
      md: 'pb-8',
      lg: 'pb-10',
      xl: 'pb-20',
    },
  },
  defaultVariants: {
    top: 'lg',
    bottom: 'lg',
  },
});
