import type { ButtonHTMLAttributes, ReactNode } from "react";


interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const BASE_CLASSES = "rounded-xl backdrop-blur hover:scale-105 transition-all duration-200";

export function GlassButton({
  children,
  className,
  ...props
}: GlassButtonProps) {
  return (
    <button className={`${BASE_CLASSES} ${className ?? ""}`} {...props}>
      {children}
    </button>
  );
}
