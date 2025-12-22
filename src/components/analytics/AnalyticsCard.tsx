"use client";

import { ReactNode } from "react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  color?: string;
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: AnalyticsCardProps) {
  return (
    <div className="py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--foreground-muted)' }}>
            {title}
          </div>
          <div className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
            {value}
          </div>
          {subtitle && (
            <div className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
              {subtitle}
            </div>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.direction === "up" && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend.direction === "down" && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className="text-xs" style={{
                color: trend.direction === "up" ? '#10b981' : trend.direction === "down" ? '#ef4444' : 'var(--foreground-muted)'
              }}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}








