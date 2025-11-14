"use client";

import VoiceUsageStatistics from '@/components/VoiceUsageStatistics';
import Link from 'next/link';

/**
 * Voice Statistics Page
 * 
 * Displays voice input usage statistics for the user
 * Requirement 15.3: Display usage statistics in user profile
 */

export default function VoiceStatsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/voice-test"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-black mb-4"
          >
            <BackIcon />
            Back to Voice Test
          </Link>
          <h1 className="text-4xl font-light text-black tracking-tight">
            Voice Input Analytics
          </h1>
          <p className="text-neutral-600 mt-2">
            Monitor your voice input usage, performance, and statistics
          </p>
        </div>

        {/* Statistics Component */}
        <VoiceUsageStatistics />

        {/* Additional Info */}
        <div className="mt-8 p-6 bg-white border border-neutral-200 rounded-lg">
          <h3 className="text-sm font-medium text-neutral-900 mb-2">About Analytics</h3>
          <div className="text-sm text-neutral-600 space-y-2">
            <p>
              Voice input analytics help you understand how you use the voice feature and track performance metrics.
            </p>
            <p>
              All data is stored locally in your browser and is never sent to external servers. You can disable
              analytics tracking or clear all data at any time.
            </p>
            <p className="text-xs text-neutral-500 mt-4">
              <strong>Privacy:</strong> Analytics data includes session duration, word count, error types, and
              performance metrics. No audio data or personal information is stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
