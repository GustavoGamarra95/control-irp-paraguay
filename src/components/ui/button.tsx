import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium shadow-soft transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-light hover:shadow-medium",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-medium",
        outline: "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-light hover:shadow-medium",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        income: "bg-gradient-income text-income-foreground hover:shadow-medium border-0",
        expense: "bg-gradient-expense text-expense-foreground hover:shadow-medium border-0",
        tax: "bg-gradient-tax text-tax-foreground hover:shadow-medium border-0",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-medium",
        "income-light": "bg-income-light text-income border border-income/20 hover:bg-income hover:text-income-foreground",
        "expense-light": "bg-expense-light text-expense border border-expense/20 hover:bg-expense hover:text-expense-foreground",
        "tax-light": "bg-tax-light text-tax border border-tax/20 hover:bg-tax hover:text-tax-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
