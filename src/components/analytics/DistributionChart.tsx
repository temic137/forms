"use client";

interface DistributionChartProps {
  title: string;
  data: Record<string, number>;
  colors?: string[];
  showLegend?: boolean;
}

const PAPER_COLORS = [
  '#000000', // Black
  '#374151', // Gray-700
  '#6b7280', // Gray-500
  '#9ca3af', // Gray-400
  '#d1d5db', // Gray-300
  '#1f2937', // Gray-800
  '#4b5563', // Gray-600
  '#e5e7eb', // Gray-200
];

export function DistributionChart({
  title,
  data,
  colors = PAPER_COLORS,
  showLegend = true,
}: DistributionChartProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="paper-card p-4 border-2 border-black/10 bg-white">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-black font-paper">{title}</h3>
      </div>
      <div className="p-0">
        {entries.length === 0 ? (
          <div 
            className="text-center py-8 font-bold font-paper text-black/40"
          >
            No data available
          </div>
        ) : (
          <>
            {/* Progress bar visualization */}
            <div className="flex rounded-lg overflow-hidden mb-6 border-2 border-black/10" style={{ height: '40px' }}>
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
                    className="border-r border-white last:border-r-0"
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
                        className="w-4 h-4 rounded flex-shrink-0 border border-black/10"
                        style={{ background: colors[index % colors.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-sm font-bold font-paper truncate text-black"
                          title={key}
                        >
                          {key}
                        </div>
                        <div className="text-xs font-paper font-bold text-black/60">
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
      </div>
    </div>
  );
}

