import { Container } from 'Components/shared/container';
import { SECTION_ANCHORED_CLASS, sectionVariants } from 'Components/shared/constants';
import type { SectionProps } from 'Components/shared/types';
import { cn } from 'Lib/utils';

export function Section({ top, bottom, anchored, className, ...props }: SectionProps) {
  const sectionClassName = cn(
    sectionVariants({ top, bottom }),
    anchored && SECTION_ANCHORED_CLASS,
    className,
  );

  return <Container as="section" className={sectionClassName} {...props} />;
}
