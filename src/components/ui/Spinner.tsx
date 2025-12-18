import React from "react";
import { Loader } from "lucide-react";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "white" | "current";
  className?: string;
}

export function Spinner({ 
  size = "md", 
  variant = "primary",
  className = "",
}: SpinnerProps) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const variantClasses = {
    primary: "text-blue-600",
    secondary: "text-gray-600",
    white: "text-white",
    current: "text-current",
  };

  return (
    <Loader
      className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Full page loading spinner - centered in viewport
 */
export function PageSpinner({ size = "lg", variant = "primary" }: SpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Spinner size={size} variant={variant} />
    </div>
  );
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonSpinner({ variant = "current" }: { variant?: "primary" | "secondary" | "white" | "current" }) {
  return <Spinner size="sm" variant={variant} className="mr-2" />;
}
