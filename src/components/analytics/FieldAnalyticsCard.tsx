"use client";

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
    if (rate >= 90) return '#000000'; // black
    if (rate >= 70) return '#4b5563'; // gray-600
    return '#9ca3af'; // gray-400
  };

  return (
    <div className="paper-card p-4 border-2 border-black/10 bg-white mb-4">
      <div className="mb-3">
        <div className="font-bold text-lg font-paper text-black">{analytics.label}</div>
        <div className="text-xs font-paper text-black/60">
          {analytics.type} field
        </div>
      </div>
      <div>
        <div className="space-y-4">
          {/* Completion Rate */}
          <div>
            <div className="flex justify-between items-center mb-2 font-paper font-bold">
              <span className="text-sm text-black/60">
                Completion Rate
              </span>
              <span
                className="font-bold"
                style={{ color: getCompletionColor(analytics.completionRate) }}
              >
                {Math.round(analytics.completionRate)}%
              </span>
            </div>
            <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden border border-black/10">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${analytics.completionRate}%`,
                  background: getCompletionColor(analytics.completionRate),
                }}
              />
            </div>
            <div className="flex justify-between mt-1 font-paper font-bold text-xs text-black/60">
              <span>{analytics.totalResponses} responses</span>
              <span>{analytics.emptyResponses} empty</span>
            </div>
          </div>

          {/* Text Field Analytics */}
          {(analytics.type === 'text' || analytics.type === 'textarea' || analytics.type === 'email') && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/10">
              <div>
                <div className="text-xs font-paper font-bold text-black/60">Avg Length</div>
                <div className="font-bold font-paper text-black">
                  {Math.round(analytics.avgLength || 0)} chars
                </div>
              </div>
              <div>
                <div className="text-xs font-paper font-bold text-black/60">Avg Words</div>
                <div className="font-bold font-paper text-black">
                  {Math.round(analytics.avgWordCount || 0)}
                </div>
              </div>
              <div>
                <div className="text-xs font-paper font-bold text-black/60">Min Length</div>
                <div className="font-bold font-paper text-black">
                  {analytics.minLength || 0}
                </div>
              </div>
              <div>
                <div className="text-xs font-paper font-bold text-black/60">Max Length</div>
                <div className="font-bold font-paper text-black">
                  {analytics.maxLength || 0}
                </div>
              </div>
            </div>
          )}

          {/* Number Field Analytics */}
          {analytics.type === 'number' && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/10">
              <div>
                <div className="text-xs font-paper font-bold text-black/60">Minimum</div>
                <div className="font-bold font-paper text-black">
                  {analytics.min !== undefined ? analytics.min : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs font-paper font-bold text-black/60">Maximum</div>
                <div className="font-bold font-paper text-black">
                  {analytics.max !== undefined ? analytics.max : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs font-paper font-bold text-black/60">Average</div>
                <div className="font-bold font-paper text-black">
                  {analytics.avg !== undefined ? Math.round(analytics.avg * 100) / 100 : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs font-paper font-bold text-black/60">Median</div>
                <div className="font-bold font-paper text-black">
                  {analytics.median !== undefined ? Math.round(analytics.median * 100) / 100 : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Choice Field Analytics */}
          {(analytics.type === 'select' || analytics.type === 'radio' || analytics.type === 'checkbox') && analytics.distribution && (
            <div className="pt-4 border-t border-black/10">
              <div className="mb-4">
                <div className="text-sm font-bold font-paper mb-2 text-black">
                  Response Distribution
                </div>
                {Object.entries(analytics.distribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([option, count]) => {
                    const percentage = analytics.totalResponses > 0 ? (count / analytics.totalResponses) * 100 : 0;
                    return (
                      <div key={option} className="mb-3">
                        <div className="flex justify-between items-center mb-1 font-paper font-bold">
                          <span className="text-sm truncate text-black" title={option}>
                            {option}
                          </span>
                          <span className="text-sm ml-2 text-black">
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden border border-black/10">
                          <div
                            className="h-full rounded-full bg-black"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              {analytics.mostPopular && (
                <div className="flex items-center gap-2 text-sm font-paper font-bold">
                  <span className="text-black/60">Most popular:</span>
                  <span className="text-black">{analytics.mostPopular}</span>
                </div>
              )}
            </div>
          )}

          {/* Date Field Analytics */}
          {analytics.type === 'date' && analytics.earliestDate && (
            <div className="pt-4 border-t border-black/10">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs font-paper font-bold text-black/60">Earliest Date</div>
                  <div className="font-bold font-paper text-black">
                    {new Date(analytics.earliestDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-paper font-bold text-black/60">Latest Date</div>
                  <div className="font-bold font-paper text-black">
                    {analytics.latestDate ? new Date(analytics.latestDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Field Analytics */}
          {analytics.type === 'file' && analytics.totalFiles !== undefined && (
            <div className="pt-4 border-t border-black/10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-paper font-bold text-black/60">Total Files</div>
                  <div className="font-bold font-paper text-black">
                    {analytics.totalFiles}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-paper font-bold text-black/60">Total Size</div>
                  <div className="font-bold font-paper text-black">
                    {formatBytes(analytics.totalSize || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-paper font-bold text-black/60">Avg File Size</div>
                  <div className="font-bold font-paper text-black">
                    {formatBytes(analytics.avgFileSize || 0)}
                  </div>
                </div>
                {analytics.fileTypes && Object.keys(analytics.fileTypes).length > 0 && (
                  <div>
                    <div className="text-xs font-paper font-bold text-black/60">File Types</div>
                    <div className="font-bold font-paper text-black">
                      {Object.entries(analytics.fileTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








