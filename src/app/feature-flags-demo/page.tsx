"use client";

import { useState } from 'react';
import { featureFlags } from '@/lib/featureFlags';
import { voiceSettings } from '@/lib/voiceSettings';

/**
 * Feature Flags Demo Page
 * 
 * This page demonstrates how feature flags work in the application.
 * It shows the current state of the voice input feature flag and
 * allows testing different scenarios.
 */
export default function FeatureFlagsDemoPage() {
  const [userId, setUserId] = useState('demo-user-123');
  const [, setRefreshKey] = useState(0);

  // Get feature flag status
  const isFeatureEnabled = featureFlags.voiceInput.isEnabled();
  const isFeatureAvailable = featureFlags.voiceInput.isAvailable();
  const hasAccess = featureFlags.voiceInput.hasAccess(userId);
  const config = featureFlags.voiceInput.getConfig();
  const userSettingEnabled = voiceSettings.isEnabled();

  const refresh = () => setRefreshKey(prev => prev + 1);

  const toggleUserSetting = () => {
    voiceSettings.setEnabled(!userSettingEnabled);
    refresh();
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-black mb-2">Feature Flags Demo</h1>
          <p className="text-neutral-600">
            This page demonstrates the feature flag system for voice input.
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-medium text-black mb-4">Current Status</h2>
          
          <div className="space-y-4">
            <StatusRow
              label="Environment Variable"
              value={process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED || 'not set (defaults to true)'}
              status={isFeatureEnabled ? 'enabled' : 'disabled'}
            />
            
            <StatusRow
              label="Feature Globally Enabled"
              value={isFeatureEnabled ? 'Yes' : 'No'}
              status={isFeatureEnabled ? 'enabled' : 'disabled'}
            />
            
            <StatusRow
              label="User Setting Enabled"
              value={userSettingEnabled ? 'Yes' : 'No'}
              status={userSettingEnabled ? 'enabled' : 'disabled'}
            />
            
            <StatusRow
              label="Feature Available"
              value={isFeatureAvailable ? 'Yes' : 'No'}
              status={isFeatureAvailable ? 'enabled' : 'disabled'}
            />
            
            <StatusRow
              label="Rollout Percentage"
              value={`${config.rolloutPercentage}%`}
              status="info"
            />
          </div>
        </div>

        {/* User Access Test */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-medium text-black mb-4">User Access Test</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Test User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter user ID"
            />
          </div>
          
          <StatusRow
            label={`Access for &quot;${userId}&quot;`}
            value={hasAccess ? 'Granted' : 'Denied'}
            status={hasAccess ? 'enabled' : 'disabled'}
          />
        </div>

        {/* User Settings Control */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-medium text-black mb-4">User Settings Control</h2>
          
          <p className="text-sm text-neutral-600 mb-4">
            Users can enable/disable voice input in their personal settings, 
            even when the feature is globally enabled.
          </p>
          
          <button
            onClick={toggleUserSetting}
            disabled={!isFeatureEnabled}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${userSettingEnabled 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-black hover:bg-neutral-800 text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {userSettingEnabled ? 'Disable' : 'Enable'} Voice Input (User Setting)
          </button>
          
          {!isFeatureEnabled && (
            <p className="text-sm text-yellow-700 mt-2">
              Cannot enable: Feature is globally disabled
            </p>
          )}
        </div>

        {/* Configuration Details */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-medium text-black mb-4">Configuration Details</h2>
          
          <div className="bg-neutral-50 rounded-lg p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(
                {
                  environment: {
                    NEXT_PUBLIC_VOICE_INPUT_ENABLED: process.env.NEXT_PUBLIC_VOICE_INPUT_ENABLED || 'undefined',
                  },
                  featureFlag: {
                    enabled: isFeatureEnabled,
                    available: isFeatureAvailable,
                    config: config,
                  },
                  userSettings: {
                    enabled: userSettingEnabled,
                  },
                  access: {
                    userId: userId,
                    hasAccess: hasAccess,
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {/* How to Configure */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-xl font-medium text-blue-900 mb-4">How to Configure</h2>
          
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-1">1. Enable Feature Globally</h3>
              <p className="mb-2">Add to your <code className="bg-blue-100 px-1 rounded">.env</code> file:</p>
              <code className="block bg-blue-100 p-2 rounded">
                NEXT_PUBLIC_VOICE_INPUT_ENABLED="true"
              </code>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">2. Disable Feature Globally</h3>
              <p className="mb-2">Add to your <code className="bg-blue-100 px-1 rounded">.env</code> file:</p>
              <code className="block bg-blue-100 p-2 rounded">
                NEXT_PUBLIC_VOICE_INPUT_ENABLED="false"
              </code>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">3. Gradual Rollout</h3>
              <p className="mb-2">
                Modify <code className="bg-blue-100 px-1 rounded">src/lib/featureFlags.ts</code> to set rollout percentage:
              </p>
              <code className="block bg-blue-100 p-2 rounded">
                rolloutPercentage: 50 // Enable for 50% of users
              </code>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">4. User-Specific Access</h3>
              <p className="mb-2">
                Modify <code className="bg-blue-100 px-1 rounded">src/lib/featureFlags.ts</code> to allow/block specific users:
              </p>
              <code className="block bg-blue-100 p-2 rounded">
                allowedUserIds: [&apos;user1&apos;, &apos;user2&apos;]<br />
                blockedUserIds: [&apos;user3&apos;]
              </code>
            </div>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-6 text-center">
          <a
            href="/FEATURE_FLAGS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Full Documentation →
          </a>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ 
  label, 
  value, 
  status 
}: { 
  label: string; 
  value: string; 
  status: 'enabled' | 'disabled' | 'info';
}) {
  const statusColors = {
    enabled: 'bg-green-100 text-green-800 border-green-200',
    disabled: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
        {value}
      </span>
    </div>
  );
}
