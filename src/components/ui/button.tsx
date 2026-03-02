import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-terracotta-600 text-white hover:bg-terracotta-700 shadow-sm",
        secondary: "bg-sage-600 text-white hover:bg-sage-700 shadow-sm",
        outline: "border-2 border-terracotta-600 text-terracotta-600 hover:bg-terracotta-50",
        ghost: "text-sand-800 hover:bg-sand-100",
        link: "text-terracotta-600 underline-offset-4 hover:underline",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-sage-600 text-white hover:bg-sage-700",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        default: "h-11 px-5 text-sm",
        lg: "h-13 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
