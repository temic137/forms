"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface DistributionChartProps {
  title: string;
  data: Record<string, number>;
  colors?: string[];
  showLegend?: boolean;
}

const DEFAULT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f97316', // orange
  '#14b8a6', // teal
];

export function DistributionChart({
  title,
  data,
  colors = DEFAULT_COLORS,
  showLegend = true,
}: DistributionChartProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div 
            className="text-center py-8"
            style={{ color: 'var(--foreground-muted)' }}
          >
            No data available
          </div>
        ) : (
          <>
            {/* Progress bar visualization */}
            <div className="flex rounded-lg overflow-hidden mb-6" style={{ height: '40px' }}>
              {entries.map(([key, value], index) => {
                const percentage = total > 0 ? (value / total) * 100 : 0;
                return (
                  <div
                    key={key}
                    style={{
                      width: `${percentage}%`,
                      background: colors[index % colors.length],
                    }}
                    title={`${key}: ${value} (${Math.round(percentage)}%)`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            {showLegend && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entries.map(([key, value], index) => {
                  const percentage = total > 0 ? (value / total) * 100 : 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ background: colors[index % colors.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--foreground)' }}
                          title={key}
                        >
                          {key}
                        </div>
                        <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>
                          {value} ({Math.round(percentage)}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

