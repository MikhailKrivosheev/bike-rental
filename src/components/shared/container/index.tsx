import type * as React from 'react';

import { cn } from 'Lib/utils';
import { ContainerProps } from './types';

const CONTAINER_CLASS = 'mx-auto w-full max-w-[1180px] px-6';

export function Container({ as = 'div', className, ...props }: ContainerProps) {
  const Element = as as React.ElementType;
  const containerClassName = cn(CONTAINER_CLASS, className);

  return <Element className={containerClassName} {...props} />;
}
