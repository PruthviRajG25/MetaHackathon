import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow active:scale-[0.99]",
      secondary: "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200",
      outline: "border border-stone-200 bg-white hover:bg-stone-50 text-stone-800",
      ghost: "hover:bg-stone-100 text-stone-700",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg font-medium",
      md: "h-10 px-4 text-sm rounded-xl font-medium",
      lg: "h-12 px-6 text-base rounded-xl font-semibold",
      icon: "h-10 w-10 p-0 rounded-xl flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
