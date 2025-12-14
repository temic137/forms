import React from "react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "white" | "current";
  className?: string;
}

export function Spinner({ 
  size = "md", 
  variant = "current",
  className = "",
  ...props 
}: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
    xl: "w-12 h-12 border-4",
  };

  const variantClasses = {
    primary: "border-gray-200 border-t-blue-600",
    secondary: "border-gray-200 border-t-gray-600",
    white: "border-white/30 border-t-white",
    current: "border-current border-t-transparent border-opacity-25",
  };

  return (
    <div
      className={`inline-block rounded-full animate-spin ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
