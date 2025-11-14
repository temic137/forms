"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DistributionChart } from "./DistributionChart";

interface FieldAnalytics {
  label: string;
  type: string;
  totalResponses: number;
  completionRate: number;
  emptyResponses: number;
  
  // Text/Textarea/Email fields
  avgLength?: number;
  avgWordCount?: number;
  minLength?: number;
  maxLength?: number;
  
  // Number fields
  min?: number;
  max?: number;
  avg?: number;
  median?: number;
  
  // Choice fields (select, radio, checkbox)
  distribution?: Record<string, number>;
  mostPopular?: string;
  leastPopular?: string;
  
  // Date fields
  earliestDate?: string;
  latestDate?: string;
  monthDistribution?: Record<string, number>;
  
  // File fields
  totalFiles?: number;
  fileTypes?: Record<string, number>;
  totalSize?: number;
  avgFileSize?: number;
}

interface FieldAnalyticsCardProps {
  fieldId: string;
  analytics: FieldAnalytics;
  totalSubmissions: number;
}

export function FieldAnalyticsCard({ fieldId, analytics, totalSubmissions }: FieldAnalyticsCardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return '#10b981'; // green
    if (rate >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{analytics.label}</CardTitle>
        <div style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem' }}>
          {analytics.type} field
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Completion Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem' }}>
                Completion Rate
              </span>
              <span 
                className="font-semibold"
                style={{ color: getCompletionColor(analytics.completionRate) }}
              >
                {Math.round(analytics.completionRate)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${analytics.completionRate}%`,
                  background: getCompletionColor(analytics.completionRate),
                }}
              />
            </div>
            <div className="flex justify-between mt-1" style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
              <span>{analytics.totalResponses} responses</span>
              <span>{analytics.emptyResponses} empty</span>
            </div>
          </div>

          {/* Text Field Analytics */}
          {(analytics.type === 'text' || analytics.type === 'textarea' || analytics.type === 'email') && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <div>
                <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Avg Length</div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {Math.round(analytics.avgLength || 0)} chars
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Avg Words</div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {Math.round(analytics.avgWordCount || 0)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Min Length</div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {analytics.minLength || 0}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Max Length</div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {analytics.maxLength || 0}
                </div>
              </div>
            </div>
          )}

          {/* Number Field Analytics */}
          {analytics.type === 'number' && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <div>
                <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Minimum</div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {analytics.min !== undefined ? analytics.min : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Maximum</div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {analytics.max !== undefined ? analytics.max : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Average</div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {analytics.avg !== undefined ? Math.round(analytics.avg * 100) / 100 : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Median</div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {analytics.median !== undefined ? Math.round(analytics.median * 100) / 100 : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Choice Field Analytics */}
          {(analytics.type === 'select' || analytics.type === 'radio' || analytics.type === 'checkbox') && analytics.distribution && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <div className="mb-4">
                <div className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  Response Distribution
                </div>
                {Object.entries(analytics.distribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([option, count]) => {
                    const percentage = analytics.totalResponses > 0 ? (count / analytics.totalResponses) * 100 : 0;
                    return (
                      <div key={option} className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm truncate" style={{ color: 'var(--foreground)' }} title={option}>
                            {option}
                          </span>
                          <span className="text-sm font-semibold ml-2" style={{ color: 'var(--foreground)' }}>
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              background: 'var(--primary)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              {analytics.mostPopular && (
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--foreground-muted)' }}>Most popular:</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{analytics.mostPopular}</span>
                </div>
              )}
            </div>
          )}

          {/* Date Field Analytics */}
          {analytics.type === 'date' && analytics.earliestDate && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Earliest Date</div>
                  <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {new Date(analytics.earliestDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Latest Date</div>
                  <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {analytics.latestDate ? new Date(analytics.latestDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Field Analytics */}
          {analytics.type === 'file' && analytics.totalFiles !== undefined && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Total Files</div>
                  <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {analytics.totalFiles}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Total Size</div>
                  <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {formatBytes(analytics.totalSize || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>Avg File Size</div>
                  <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {formatBytes(analytics.avgFileSize || 0)}
                  </div>
                </div>
                {analytics.fileTypes && Object.keys(analytics.fileTypes).length > 0 && (
                  <div>
                    <div style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>File Types</div>
                    <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {Object.entries(analytics.fileTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}





