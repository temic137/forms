"use client";

import { useState, useEffect } from 'react';

interface UsageStats {
  totalSessions: number;
  totalTranscripts: number;
  totalWords: number;
  averageSessionDuration: number;
  successRate: number;
  lastUsed: string | null;
  topLanguages: { language: string; count: number }[];
}

export interface VoiceUsageStatisticsProps {
  userId?: string;
}

export default function VoiceUsageStatistics({ userId }: VoiceUsageStatisticsProps) {
  const [stats, setStats] = useState<UsageStats>({
    totalSessions: 0,
    totalTranscripts: 0,
    totalWords: 0,
    averageSessionDuration: 0,
    successRate: 0,
    lastUsed: null,
    topLanguages: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = () => {
    setIsLoading(true);
    
    try {
      // Try to load stats from localStorage
      const storedStats = localStorage.getItem('voice_usage_stats');
      
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        setStats(parsed);
      } else {
        // Initialize with default stats
        const defaultStats: UsageStats = {
          totalSessions: 0,
          totalTranscripts: 0,
          totalWords: 0,
          averageSessionDuration: 0,
          successRate: 100,
          lastUsed: null,
          topLanguages: [{ language: 'en-US', count: 0 }],
        };
        setStats(defaultStats);
      }
    } catch (error) {
      console.error('Error loading voice usage statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="🎤"
          label="Total Sessions"
          value={stats.totalSessions}
          subtext={`Last used ${formatDate(stats.lastUsed)}`}
        />
        <StatCard
          icon="📝"
          label="Transcripts Generated"
          value={stats.totalTranscripts}
        />
        <StatCard
          icon="💬"
          label="Total Words"
          value={stats.totalWords.toLocaleString()}
        />
        <StatCard
          icon="⏱️"
          label="Avg. Session"
          value={formatDuration(stats.averageSessionDuration)}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Success Rate
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recognition Success</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.successRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.successRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Languages Used
          </h3>
          <div className="space-y-3">
            {stats.topLanguages.map((lang, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {getLanguageName(lang.language)}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {lang.count} sessions
                </span>
              </div>
            ))}
            {stats.topLanguages.length === 0 && (
              <p className="text-sm text-gray-500 italic">No language data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <span>💡</span>
          <span>Tips for Better Voice Input</span>
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Speak clearly and at a moderate pace</li>
          <li>• Use a quiet environment for best results</li>
          <li>• Position your microphone properly</li>
          <li>• Pause briefly between sentences</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'es-ES': 'Spanish',
    'fr-FR': 'French',
    'de-DE': 'German',
    'it-IT': 'Italian',
    'pt-BR': 'Portuguese',
    'zh-CN': 'Chinese',
    'ja-JP': 'Japanese',
    'ko-KR': 'Korean',
  };

  return languages[code] || code;
}
