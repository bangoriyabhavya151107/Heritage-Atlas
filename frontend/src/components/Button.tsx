import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-indigo text-white hover:bg-indigo/90 focus-visible:ring-indigo",
  secondary: "border border-indigo/25 bg-paper text-indigo hover:bg-indigo/5 focus-visible:ring-indigo",
  quiet: "text-indigo hover:bg-indigo/5 focus-visible:ring-indigo",
  danger: "bg-[#8E2924] text-white hover:bg-[#76221F] focus-visible:ring-[#8E2924]",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
