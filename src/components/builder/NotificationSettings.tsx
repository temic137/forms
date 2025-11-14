"use client";

import { NotificationConfig, EmailNotificationConfig } from "@/types/form";
import { useState } from "react";
import { Mail, ChevronDown, ChevronUp, X } from "lucide-react";

interface NotificationSettingsProps {
  config: NotificationConfig | undefined;
  onChange: (config: NotificationConfig) => void;
}

export default function NotificationSettings({
  config,
  onChange,
}: NotificationSettingsProps) {
  const [emailInput, setEmailInput] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["email"]));

  // Initialize config with legacy support
  const getCurrentConfig = (): NotificationConfig => {
    if (config) {
      if (config.recipients && !config.email) {
        return {
          ...config,
          email: {
            enabled: config.enabled,
            recipients: config.recipients,
            includeSubmissionData: config.includeSubmissionData ?? true,
            customMessage: config.customMessage,
          },
        };
      }
      return config;
    }
    return { enabled: false };
  };

  const currentConfig = getCurrentConfig();

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const handleToggle = () => {
    onChange({
      ...currentConfig,
      enabled: !currentConfig.enabled,
    });
  };

  // Email handlers
  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    const emailConfig = currentConfig.email || {
      enabled: true,
      recipients: [],
      includeSubmissionData: true,
    };

    if (emailConfig.recipients.includes(trimmedEmail)) {
      alert("This email is already in the recipient list");
      return;
    }

    onChange({
      ...currentConfig,
      email: {
        ...emailConfig,
        recipients: [...emailConfig.recipients, trimmedEmail],
      },
    });
    setEmailInput("");
  };

  const handleRemoveEmail = (email: string) => {
    const emailConfig = currentConfig.email;
    if (!emailConfig) return;

    onChange({
      ...currentConfig,
      email: {
        ...emailConfig,
        recipients: emailConfig.recipients.filter((e) => e !== email),
      },
    });
  };

  const updateEmailConfig = (updates: Partial<EmailNotificationConfig>) => {
    const emailConfig = currentConfig.email || {
      enabled: true,
      recipients: [],
      includeSubmissionData: true,
    };
    onChange({
      ...currentConfig,
      email: { ...emailConfig, ...updates },
    });
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const emailConfig = currentConfig.email || {
    enabled: false,
    recipients: [],
    includeSubmissionData: true,
  };


  const NotificationCard = ({ 
    id, 
    title, 
    icon: Icon, 
    enabled, 
    onToggle, 
    children 
  }: { 
    id: string;
    title: string;
    icon: any;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    children: React.ReactNode;
  }) => {
    const isExpanded = expanded.has(id);
    
    return (
      <div className="border border-gray-200 rounded-lg bg-white">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleExpanded(id)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {enabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label 
              className="relative inline-flex items-center cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => onToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
        {isExpanded && enabled && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Get notified when forms are submitted
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={currentConfig.enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
        </label>
      </div>

      {currentConfig.enabled && (
        <div className="space-y-3">
          {/* Email Card - Only notification type available */}
          <NotificationCard
            id="email"
            title="Email"
            icon={Mail}
            enabled={emailConfig.enabled}
            onToggle={(enabled) => updateEmailConfig({ enabled })}
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Recipients
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="email@example.com"
                  className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {emailConfig.recipients.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {emailConfig.recipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeData"
                checked={emailConfig.includeSubmissionData}
                onChange={(e) => updateEmailConfig({ includeSubmissionData: e.target.checked })}
                className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeData" className="text-xs text-gray-700">
                Include submission data
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Custom Message <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={emailConfig.customMessage || ""}
                onChange={(e) => updateEmailConfig({ customMessage: e.target.value })}
                placeholder="Add a custom message..."
                rows={2}
                className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </NotificationCard>
        </div>
      )}
    </div>
  );
}
