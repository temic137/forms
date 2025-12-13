"use client";

import { useState } from "react";
import { QuizModeConfig } from "@/types/form";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

interface QuizSettingsProps {
  config?: QuizModeConfig;
  onChange: (config: QuizModeConfig | undefined) => void;
}

export default function QuizSettings({ config, onChange }: QuizSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isEnabled = config?.enabled || false;

  const handleToggle = (enabled: boolean) => {
    if (!enabled) {
      onChange(undefined);
    } else {
      onChange({
        enabled: true,
        showScoreImmediately: true,
        showCorrectAnswers: true,
        showExplanations: true,
        passingScore: 70,
        allowRetakes: false,
      });
    }
  };

  const updateConfig = (updates: Partial<QuizModeConfig>) => {
    onChange({
      enabled: true,
      showScoreImmediately: config?.showScoreImmediately ?? true,
      showCorrectAnswers: config?.showCorrectAnswers ?? true,
      showExplanations: config?.showExplanations ?? true,
      passingScore: config?.passingScore ?? 70,
      allowRetakes: config?.allowRetakes ?? false,
      ...updates,
    });
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="border border-gray-200 rounded-lg bg-white">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${isEnabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Quiz Mode</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEnabled ? "Enabled - Form will be scored like a quiz" : "Disabled"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => handleToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {isExpanded && isEnabled && (
          <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config?.showScoreImmediately ?? true}
                  onChange={(e) => updateConfig({ showScoreImmediately: e.target.checked })}
                  className="mt-0.5 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                />
                <div>
                  <div className="font-medium">Show score immediately</div>
                  <div className="text-xs text-gray-500">Display the score right after submission</div>
                </div>
              </label>

              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config?.showCorrectAnswers ?? true}
                  onChange={(e) => updateConfig({ showCorrectAnswers: e.target.checked })}
                  className="mt-0.5 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                />
                <div>
                  <div className="font-medium">Show correct answers</div>
                  <div className="text-xs text-gray-500">Highlight which answers were correct/incorrect</div>
                </div>
              </label>

              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config?.showExplanations ?? true}
                  onChange={(e) => updateConfig({ showExplanations: e.target.checked })}
                  className="mt-0.5 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                />
                <div>
                  <div className="font-medium">Show explanations</div>
                  <div className="text-xs text-gray-500">Display answer explanations after submission</div>
                </div>
              </label>

              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config?.allowRetakes ?? false}
                  onChange={(e) => updateConfig({ allowRetakes: e.target.checked })}
                  className="mt-0.5 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                />
                <div>
                  <div className="font-medium">Allow retakes</div>
                  <div className="text-xs text-gray-500">Let users retake the quiz multiple times</div>
                </div>
              </label>

              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config?.shuffleQuestions ?? false}
                  onChange={(e) => updateConfig({ shuffleQuestions: e.target.checked })}
                  className="mt-0.5 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                />
                <div>
                  <div className="font-medium">Shuffle question order</div>
                  <div className="text-xs text-gray-500">Randomize the order of questions for each respondent</div>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config?.passingScore ?? 70}
                onChange={(e) => updateConfig({ passingScore: parseInt(e.target.value) || 70 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="70"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum percentage to pass the quiz</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Quiz Mode Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Set correct answers for each field in the field properties panel</li>
                    <li>Assign points to each question (default is 1 point)</li>
                    <li>Add explanations to help users learn from their mistakes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


