import { Container } from "@/components/shared/container";
import { cva } from "class-variance-authority";
import { cn } from "Lib/utils";
import { SectionProps } from "./types";

const SECTION_ANCHORED_CLASS = 'scroll-mt-20';

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

export function Section({
  top,
  bottom,
  anchored,
  className,
  ...props
}: SectionProps) {
  const sectionClassName = cn(
    sectionVariants({ top, bottom }),
    anchored && SECTION_ANCHORED_CLASS,
    className,
  );

  return <Container as="section" className={sectionClassName} {...props} />;
}
