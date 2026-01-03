"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface BarChartProps {
  title: string;
  data: Record<string, number>;
  labels?: Record<string, string>;
  color?: string;
  height?: number;
  showPercentage?: boolean;
}

export function BarChart({
  title,
  data,
  labels = {},
  color = "#000000",
  height = 300,
  showPercentage = false,
}: BarChartProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);
  const totalValue = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="paper-card p-4 border-2 border-black/10 bg-white">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-black font-paper">{title}</h3>
      </div>
      <div className="p-0">
        <div style={{ height: `${height}px`, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map(([key, value]) => {
            const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
            const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={key} className="flex items-center gap-3">
                <div 
                  className="text-sm font-bold flex-shrink-0 font-paper"
                  style={{ 
                    color: '#000000',
                    minWidth: '120px',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={labels[key] || key}
                >
                  {labels[key] || key}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div 
                    className="h-6 rounded-md transition-all"
                    style={{ 
                      width: `${barWidth}%`,
                      background: color,
                      minWidth: value > 0 ? '2px' : '0',
                      opacity: 0.8
                    }}
                  />
                  <div 
                    className="text-sm font-bold flex-shrink-0 font-paper"
                    style={{ color: '#000000', minWidth: '50px' }}
                  >
                    {value}
                    {showPercentage && ` (${Math.round(percentage)}%)`}
                  </div>
                </div>
              </div>
            );
          })}
          {entries.length === 0 && (
            <div 
              className="flex items-center justify-center h-full font-bold font-paper text-black/40"
            >
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








