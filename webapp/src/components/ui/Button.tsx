import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer font-sans",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-transparent text-text-primary hover:bg-muted hover:text-text-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted border border-border",
        ghost: "text-text-primary hover:bg-muted",
        text: "text-text-secondary hover:text-text-primary p-0 h-auto",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-8 gap-1.5 px-3 py-1.5 text-xs font-mono",
        sm: "h-7 gap-1 px-2.5 py-1 text-xs font-mono",
        md: "h-8 gap-1.5 px-3 py-1.5 text-xs font-mono",
        lg: "h-9 gap-2 px-4 py-2 text-sm",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"]
export type ButtonSize = VariantProps<typeof buttonVariants>["size"]

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonPrimitive.Props & VariantProps<typeof buttonVariants>
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
