import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const typographyVariants = cva("font-sans text-foreground", {
  variants: {
    variant: {
      h1: "typography-h1",
      h2: "typography-h2",
      h3: "typography-h3",
      p: "typography-p",
      muted: "typography-p text-muted-foreground",
      small: "typography-small",
      label: "typography-label text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
})

type TypographyVariant = NonNullable<VariantProps<typeof typographyVariants>["variant"]>
type TypographyElement = "h1" | "h2" | "h3" | "p" | "span" | "small" | "label"

const defaultElementByVariant: Record<TypographyVariant, TypographyElement> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  p: "p",
  muted: "p",
  small: "small",
  label: "span",
}

type TypographyProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof typographyVariants> & {
    as?: TypographyElement
  }

const Typography = React.forwardRef<HTMLElement, TypographyProps>(function Typography(
  { as, className, variant = "p", ...props },
  ref
) {
  const resolvedVariant = variant ?? "p"
  const Component = as ?? defaultElementByVariant[resolvedVariant]

  return React.createElement(Component, {
    ref,
    className: cn(typographyVariants({ variant: resolvedVariant }), className),
    ...props,
  })
})

export { Typography, typographyVariants }
