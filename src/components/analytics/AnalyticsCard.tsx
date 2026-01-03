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
    <div className="paper-card p-4 border-2 border-black/10 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wide mb-1 text-black/50 font-paper">
            {title}
          </div>
          <div className="text-xl font-bold text-black font-paper">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs mt-1 text-black/50 font-bold font-paper">
              {subtitle}
            </div>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1 font-paper font-bold text-xs">
              {trend.direction === "up" && (
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend.direction === "down" && (
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className={trend.direction === "up" ? "text-green-600" : trend.direction === "down" ? "text-red-600" : "text-black/60"}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-black/5 rounded-lg text-black/60">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}








