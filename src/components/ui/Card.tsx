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
      className={`border transition-all ${hover ? "duration-200" : ""} ${className}`}
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--card-shadow)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.background = 'var(--card-bg-hover)';
          e.currentTarget.style.borderColor = 'var(--card-border-hover)';
          e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.background = 'var(--card-bg)';
          e.currentTarget.style.borderColor = 'var(--card-border)';
          e.currentTarget.style.boxShadow = 'var(--card-shadow)';
        }
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={`px-4 sm:px-6 py-4 sm:py-5 border-b ${className}`}
      style={{ borderColor: 'var(--divider)' }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 
      className={`text-lg font-medium ${className}`}
      style={{ color: 'var(--foreground)' }}
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
          className="text-sm font-medium mb-1"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {label}
        </div>
        <div 
          className="text-base"
          style={{ color: 'var(--foreground)' }}
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
      className="h-px my-0"
      style={{ background: 'var(--divider)' }}
    />
  );
}
