"use client";

import { useState, useEffect } from 'react';
import { voiceAnalytics, VoiceUsageStatistics } from '@/lib/voiceAnalytics';
import { LANGUAGE_NAMES, SupportedLanguage } from '@/lib/languageDetection';

/**
 * VoiceUsageStatistics Component
 * 
 * Displays voice input usage statistics for the user
 * Requirement 15.3: Display usage statistics in user profile
 */

export interface VoiceUsageStatisticsProps {
  onClose?: () => void;
}

export default function VoiceUsageStatisticsComponent({ onClose }: VoiceUsageStatisticsProps) {
  const [stats, setStats] = useState<VoiceUsageStatistics | null>(null);
  const [errorFrequency, setErrorFrequency] = useState<Record<string, number>>({});
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, { avg: number; min: number; max: number; count: number }>>({});
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Load statistics on mount
    const loadStatistics = () => {
      const statistics = voiceAnalytics.getUsageStatistics();
      const errors = voiceAnalytics.getErrorFrequency();
      const performance = voiceAnalytics.getPerformanceMetrics();

      setStats(statistics);
      setErrorFrequency(errors);
      setPerformanceMetrics(performance);
    };

    loadStatistics();
  }, []);

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all voice input analytics data? This cannot be undone.')) {
      voiceAnalytics.clearAll();
      setStats(voiceAnalytics.getUsageStatistics());
      setErrorFrequency({});
      setPerformanceMetrics({});
    }
  };

  const handleToggleAnalytics = () => {
    const currentlyEnabled = voiceAnalytics.isEnabled();
    voiceAnalytics.setEnabled(!currentlyEnabled);
    
    if (!currentlyEnabled) {
      // Reload stats if re-enabled
      setStats(voiceAnalytics.getUsageStatistics());
    }
  };

  if (!stats) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-8 bg-neutral-200 rounded"></div>
          <div className="h-8 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const analyticsEnabled = voiceAnalytics.isEnabled();

  return (
    <div className="bg-white border border-neutral-200 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-normal text-black">Voice Input Statistics</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Track your voice input usage and performance
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
              aria-label="Close statistics"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Analytics Toggle */}
      <div className="p-6 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">Analytics Tracking</p>
            <p className="text-xs text-neutral-600 mt-0.5">
              {analyticsEnabled 
                ? 'Usage data is being collected to improve your experience'
                : 'Analytics tracking is disabled'}
            </p>
          </div>
          <button
            onClick={handleToggleAnalytics}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
              analyticsEnabled ? 'bg-black' : 'bg-neutral-300'
            }`}
            role="switch"
            aria-checked={analyticsEnabled}
            aria-label="Toggle analytics tracking"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {!analyticsEnabled && (
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-sm text-neutral-600">
              Analytics tracking is disabled. Enable it to see your usage statistics.
            </p>
          </div>
        </div>
      )}

      {analyticsEnabled && stats.totalSessions === 0 && (
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-sm text-neutral-600">
              No voice input sessions recorded yet. Start using voice input to see statistics here.
            </p>
          </div>
        </div>
      )}

      {analyticsEnabled && stats.totalSessions > 0 && (
        <>
          {/* Overview Stats */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Sessions"
              value={stats.totalSessions.toString()}
              icon={<SessionIcon />}
            />
            <StatCard
              label="Forms Created"
              value={stats.totalFormsGenerated.toString()}
              icon={<FormIcon />}
            />
            <StatCard
              label="Success Rate"
              value={`${Math.round((1 - stats.errorRate) * 100)}%`}
              icon={<SuccessIcon />}
            />
            <StatCard
              label="Total Time"
              value={formatDuration(stats.totalDuration)}
              icon={<ClockIcon />}
            />
          </div>

          {/* Detailed Stats */}
          <div className="p-6 border-t border-neutral-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailCard
                label="Average Session Duration"
                value={formatDuration(stats.averageDuration)}
              />
              <DetailCard
                label="Average Words per Session"
                value={Math.round(stats.averageWords).toString()}
              />
              <DetailCard
                label="Successful Sessions"
                value={`${stats.successfulSessions} / ${stats.totalSessions}`}
              />
              <DetailCard
                label="Last Used"
                value={stats.lastUsed ? formatDate(stats.lastUsed) : 'Never'}
              />
            </div>
          </div>

          {/* Language Distribution */}
          {Object.keys(stats.languageDistribution).length > 0 && (
            <div className="p-6 border-t border-neutral-200">
              <h4 className="text-sm font-medium text-neutral-900 mb-3">Language Usage</h4>
              <div className="space-y-2">
                {Object.entries(stats.languageDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, count]) => (
                    <div key={lang} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700">
                        {LANGUAGE_NAMES[lang as SupportedLanguage] || lang}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full"
                            style={{
                              width: `${(count / stats.totalSessions) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-neutral-600 w-12 text-right">
                          {count} ({Math.round((count / stats.totalSessions) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Advanced Details Toggle */}
          <div className="p-6 border-t border-neutral-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-neutral-700 hover:text-black focus:outline-none"
            >
              <span>{showDetails ? 'Hide' : 'Show'} Advanced Details</span>
              <ChevronIcon className={showDetails ? 'rotate-180' : ''} />
            </button>

            {showDetails && (
              <div className="mt-4 space-y-6">
                {/* Error Frequency */}
                {Object.keys(errorFrequency).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">Error Frequency</h4>
                    <div className="space-y-2">
                      {Object.entries(errorFrequency)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between text-sm">
                            <span className="text-neutral-700">{type}</span>
                            <span className="text-neutral-600">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Performance Metrics */}
                {Object.keys(performanceMetrics).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">Performance Metrics</h4>
                    <div className="space-y-2">
                      {Object.entries(performanceMetrics).map(([name, metric]) => (
                        <div key={name} className="text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-neutral-700">{name}</span>
                            <span className="text-neutral-600">
                              avg: {metric.avg.toFixed(0)}ms
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500">
                            min: {metric.min.toFixed(0)}ms, max: {metric.max.toFixed(0)}ms, count: {metric.count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Browser Compatibility Issues */}
                {stats.browserCompatibilityIssues > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-2">Browser Compatibility</h4>
                    <p className="text-sm text-neutral-600">
                      {stats.browserCompatibilityIssues} compatibility issue(s) detected
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-neutral-200 bg-neutral-50">
            <button
              onClick={handleClearData}
              className="text-sm text-red-600 hover:text-red-700 focus:outline-none"
            >
              Clear All Analytics Data
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Helper Components

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-neutral-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-neutral-600">{icon}</div>
        <span className="text-xs text-neutral-600">{label}</span>
      </div>
      <div className="text-2xl font-light text-black">{value}</div>
    </div>
  );
}

interface DetailCardProps {
  label: string;
  value: string;
}

function DetailCard({ label, value }: DetailCardProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
      <span className="text-sm text-neutral-700">{label}</span>
      <span className="text-sm font-medium text-black">{value}</span>
    </div>
  );
}

// Icon Components

function SessionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 1C7.20435 1 6.44129 1.31607 5.87868 1.87868C5.31607 2.44129 5 3.20435 5 4V8C5 8.79565 5.31607 9.55871 5.87868 10.1213C6.44129 10.6839 7.20435 11 8 11C8.79565 11 9.55871 10.6839 10.1213 10.1213C10.6839 9.55871 11 8.79565 11 8V4C11 3.20435 10.6839 2.44129 10.1213 1.87868C9.55871 1.31607 8.79565 1 8 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3 8C3 9.32608 3.52678 10.5979 4.46447 11.5355C5.40215 12.4732 6.67392 13 8 13C9.32608 13 10.5979 12.4732 11.5355 11.5355C12.4732 10.5979 13 9.32608 13 8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 13V15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FormIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 11H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface ChevronIconProps {
  className?: string;
}

function ChevronIcon({ className }: ChevronIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform ${className || ''}`}
    >
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
