"use client";

import { Card, CardContent } from "@/components/ui/Card";
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
  color = "var(--primary)",
}: AnalyticsCardProps) {
  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {title}
            </div>
            <div 
              className="text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            >
              {value}
            </div>
            {subtitle && (
              <div style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {subtitle}
              </div>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.direction === "up" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {trend.direction === "down" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span style={{ 
                  fontSize: '0.875rem',
                  color: trend.direction === "up" ? '#10b981' : trend.direction === "down" ? '#ef4444' : 'var(--foreground-muted)'
                }}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div style={{ color, opacity: 0.7 }}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}





