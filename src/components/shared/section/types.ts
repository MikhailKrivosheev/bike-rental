import { VariantProps } from "class-variance-authority";
import { sectionVariants } from ".";

export type SectionProps = React.ComponentProps<'section'> &
  VariantProps<typeof sectionVariants> & {
    anchored?: boolean;
  };