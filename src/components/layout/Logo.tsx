"use client";

import Link from "next/link";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({ showText = true, size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link href="/" className={`flex items-center gap-3 ${className} group`}>
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        {/* Modern Form Icon - sleek black and white design */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transition-transform group-hover:scale-105"
        >
          {/* Main document/paper shape with shadow effect */}
          <rect
            x="4"
            y="6"
            width="28"
            height="30"
            rx="3"
            fill="black"
            stroke="black"
            strokeWidth="2"
          />
          {/* Paper fold corner detail */}
          <path
            d="M28 6 L32 10 L28 10 Z"
            fill="white"
            stroke="black"
            strokeWidth="1"
          />
          {/* Form field lines - representing input fields */}
          <line
            x1="10"
            y1="14"
            x2="26"
            y2="14"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="10"
            y1="20"
            x2="26"
            y2="20"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="10"
            y1="26"
            x2="22"
            y2="26"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Checkbox with checkmark - representing completed form */}
          <rect
            x="10"
            y="30"
            width="6"
            height="6"
            rx="1"
            fill="white"
            stroke="white"
            strokeWidth="1.5"
          />
          <path
            d="M12 32.5 L13.5 34 L16 31.5"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      {showText && (
        <span
          className={`${textSizes[size]} font-black text-black tracking-tight group-hover:opacity-80 transition-opacity`}
        >
          AnyForm
        </span>
      )}
    </Link>
  );
}

