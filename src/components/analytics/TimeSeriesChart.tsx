"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface TimeSeriesChartProps {
  title: string;
  data: Record<string, number>;
  color?: string;
  height?: number;
  showPoints?: boolean;
}

export function TimeSeriesChart({
  title,
  data,
  color = "var(--primary)",
  height = 200,
  showPoints = true,
}: TimeSeriesChartProps) {
  const entries = Object.entries(data).sort(([a], [b]) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
  
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="text-center py-8"
            style={{ color: 'var(--foreground-muted)' }}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...entries.map(([, v]) => v), 1);
  const minValue = Math.min(...entries.map(([, v]) => v), 0);
  const range = maxValue - minValue || 1;

  // Calculate SVG path
  const padding = 20;
  const width = 800;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;
  
  const points = entries.map(([, value], index) => {
    const x = padding + (index / (entries.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y, value };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Create area path
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: '100%' }}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <g opacity="0.1">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding + chartHeight * (1 - ratio);
                return (
                  <line
                    key={ratio}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                );
              })}
            </g>

            {/* Area fill */}
            <path
              d={areaPath}
              fill={color}
              opacity="0.2"
            />

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {showPoints && points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={color}
                  stroke="var(--card-bg)"
                  strokeWidth="2"
                />
                <title>{entries[index][0]}: {point.value}</title>
              </g>
            ))}
          </svg>
        </div>

        {/* Date labels */}
        <div className="flex justify-between mt-4 px-2">
          {entries.length > 0 && (
            <>
              <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>
                {entries[0][0]}
              </div>
              {entries.length > 1 && (
                <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>
                  {entries[entries.length - 1][0]}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}






