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
  color = "var(--primary)",
  height = 300,
  showPercentage = false,
}: BarChartProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);
  const totalValue = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px`, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map(([key, value]) => {
            const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
            const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={key} className="flex items-center gap-3">
                <div 
                  className="text-sm font-medium flex-shrink-0"
                  style={{ 
                    color: 'var(--foreground)',
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
                    className="h-8 rounded transition-all"
                    style={{ 
                      width: `${barWidth}%`,
                      background: color,
                      minWidth: value > 0 ? '2px' : '0'
                    }}
                  />
                  <div 
                    className="text-sm font-semibold flex-shrink-0"
                    style={{ color: 'var(--foreground)', minWidth: '50px' }}
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
              className="flex items-center justify-center h-full"
              style={{ color: 'var(--foreground-muted)' }}
            >
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}





