import type * as React from 'react';
import type { VariantProps } from 'class-variance-authority';

import type { sectionVariants } from 'Components/shared/constants';

export type ContainerElement =
  | 'div'
  | 'section'
  | 'main'
  | 'header'
  | 'footer'
  | 'nav'
  | 'aside';

export type ContainerProps = React.HTMLAttributes<HTMLElement> & {
  as?: ContainerElement;
  ref?: React.Ref<HTMLElement>;
};

export type SectionProps = React.ComponentProps<'section'> &
  VariantProps<typeof sectionVariants> & {
    /** Anchor targets need room under the sticky header when scrolled to. */
    anchored?: boolean;
  };
