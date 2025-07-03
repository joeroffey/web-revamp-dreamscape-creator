import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium ring-offset-background transition-[var(--transition-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-button)] hover:bg-primary/90 hover:shadow-[var(--shadow-wellness)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        wellness: "bg-primary text-primary-foreground shadow-[var(--shadow-button)] hover:bg-primary-glow hover:shadow-[var(--shadow-wellness)] hover:scale-105",
        ice: "bg-accent text-accent-foreground shadow-[var(--shadow-button)] hover:bg-accent/90 hover:shadow-[var(--shadow-wellness)] hover:scale-105",
        heat: "text-white shadow-[var(--shadow-button)] hover:opacity-90 hover:scale-105 gradient-heat",
        hero: "bg-primary/90 backdrop-blur-sm text-primary-foreground border border-primary-glow/30 shadow-[var(--shadow-wellness)] hover:bg-primary hover:shadow-[var(--shadow-wellness)] hover:scale-105"
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-14 rounded-[var(--radius)] px-10 text-base",
        xl: "h-16 rounded-[var(--radius)] px-12 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
