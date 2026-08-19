import type * as React from 'react';

import { CONTAINER_CLASS } from 'Components/shared/constants';
import type { ContainerProps } from 'Components/shared/types';
import { cn } from 'Lib/utils';

export function Container({ as = 'div', className, ...props }: ContainerProps) {
  const Element = as as React.ElementType;
  const containerClassName = cn(CONTAINER_CLASS, className);

  return <Element className={containerClassName} {...props} />;
}
