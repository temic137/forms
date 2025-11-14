"use client";

import { NotificationConfig } from "@/types/form";
import { useState } from "react";

interface NotificationSettingsProps {
  config: NotificationConfig | undefined;
  onChange: (config: NotificationConfig) => void;
}

export default function NotificationSettings({
  config,
  onChange,
}: NotificationSettingsProps) {
  const [emailInput, setEmailInput] = useState("");

  const currentConfig: NotificationConfig = config || {
    enabled: false,
    recipients: [],
    includeSubmissionData: true,
    customMessage: "",
  };

  const handleToggle = () => {
    onChange({
      ...currentConfig,
      enabled: !currentConfig.enabled,
    });
  };

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    // Check for duplicates
    if (currentConfig.recipients.includes(trimmedEmail)) {
      alert("This email is already in the recipient list");
      return;
    }

    onChange({
      ...currentConfig,
      recipients: [...currentConfig.recipients, trimmedEmail],
    });
    setEmailInput("");
  };

  const handleRemoveEmail = (email: string) => {
    onChange({
      ...currentConfig,
      recipients: currentConfig.recipients.filter((e) => e !== email),
    });
  };

  const handleIncludeDataToggle = () => {
    onChange({
      ...currentConfig,
      includeSubmissionData: !currentConfig.includeSubmissionData,
    });
  };

  const handleCustomMessageChange = (message: string) => {
    onChange({
      ...currentConfig,
      customMessage: message,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Email Notifications
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Get notified when someone submits this form
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={currentConfig.enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
        </label>
      </div>

      {currentConfig.enabled && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Email Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Recipients
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Recipients List */}
            {currentConfig.recipients.length > 0 && (
              <div className="mt-3 space-y-2">
                {currentConfig.recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <span className="text-sm text-gray-700">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {currentConfig.recipients.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No recipients added yet. Add at least one email to receive
                notifications.
              </p>
            )}
          </div>

          {/* Include Submission Data */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="includeData"
              checked={currentConfig.includeSubmissionData}
              onChange={handleIncludeDataToggle}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeData" className="ml-2">
              <span className="text-sm font-medium text-gray-700">
                Include submission data in email
              </span>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, the email will contain all form field values and
                file attachments
              </p>
            </label>
          </div>

          {/* Custom Message */}
          <div>
            <label
              htmlFor="customMessage"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Custom Message (Optional)
            </label>
            <textarea
              id="customMessage"
              value={currentConfig.customMessage || ""}
              onChange={(e) => handleCustomMessageChange(e.target.value)}
              placeholder="Add a custom message to include in notification emails..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will appear at the top of notification emails
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Notifications will be sent within 30 seconds of form
                  submission. File download links expire after 7 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
