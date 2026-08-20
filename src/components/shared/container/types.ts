import type * as React from 'react';

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