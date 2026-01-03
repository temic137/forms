import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", hover = false, onClick }: CardProps) {
  return (
    <div
      className={`paper-card ${hover ? "hover:shadow-[6px_6px_0px_0px_#000]" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`px-4 sm:px-6 py-4 sm:py-5 border-b-[3px] border-black ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h3
      className={`text-xl font-bold text-black ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 sm:px-6 py-4 sm:py-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardSection({
  label,
  value,
  action,
  className = ""
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between py-4 ${className}`}>
      <div className="flex-1 min-w-0 pr-4">
        <div
          className="text-sm font-bold mb-1 text-gray-600"
        >
          {label}
        </div>
        <div
          className="text-base text-black"
        >
          {value}
        </div>
      </div>
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

export function CardDivider() {
  return (
    <div
      className="h-[2px] my-0 bg-black"
    />
  );
}
