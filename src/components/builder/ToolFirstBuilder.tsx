"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ToolFirstBuilderProps {
  initialBrief?: string;
  onGenerate: (brief: string) => Promise<void>;
  onVoiceClick: () => void;
  onTemplateClick: () => void;
  loading?: boolean;
}

export default function ToolFirstBuilder({
  initialBrief = "",
  onGenerate,
  onVoiceClick,
  onTemplateClick,
  loading = false,
}: ToolFirstBuilderProps) {
  const [query, setQuery] = useState(initialBrief);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      await onGenerate(query.trim());
    }
  };

  const suggestions = [
    "Add a phone number field",
    "Make email optional",
    "Add file upload for resume",
    "Create a multi-step form",
    "Add conditional logic",
    "Change button color to blue",
  ];

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Main Action Bar */}
        <form onSubmit={handleSubmit} className="mb-3">
          <div 
            className={`
              relative w-full transition-all duration-200
              ${isFocused ? 'shadow-md' : 'shadow-sm hover:shadow-md'}
            `}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Describe what you want to add or change..."
              className="w-full pl-12 pr-32 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={onVoiceClick}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Use voice input"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={Boolean(!query.trim() || loading)}
                className="px-4 py-1.5 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "..." : "Go"}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Quick:</span>
          <button
            onClick={onTemplateClick}
            className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Templates
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Start Over
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setQuery(suggestions[Math.floor(Math.random() * suggestions.length)])}
            className="px-3 py-1 text-white hover:bg-[#1a1a1a] rounded-md transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Suggest
          </button>
        </div>
      </div>
    </div>
  );
}
