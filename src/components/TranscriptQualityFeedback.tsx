'use client';

import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface TranscriptQualityFeedbackProps {
  quality: 'high' | 'medium' | 'low';
  confidence: number;
  suggestions: string[];
  onRetry?: () => void;
}

/**
 * Component to show transcript quality feedback to users
 * Helps users understand if their voice input was clear and provides suggestions
 */
export default function TranscriptQualityFeedback({
  quality,
  confidence,
  suggestions,
  onRetry,
}: TranscriptQualityFeedbackProps) {
  if (quality === 'high' && suggestions.length === 0) {
    // Don't show anything for perfect quality
    return null;
  }

  const getQualityInfo = () => {
    switch (quality) {
      case 'high':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          title: 'Great voice input!',
          bgColor: 'bg-green-50 dark:bg-green-900/10',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-300',
        };
      case 'medium':
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          title: 'Voice input received',
          bgColor: 'bg-blue-50 dark:bg-blue-900/10',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-300',
        };
      case 'low':
        return {
          icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
          title: 'Voice input unclear',
          bgColor: 'bg-orange-50 dark:bg-orange-900/10',
          borderColor: 'border-orange-200 dark:border-orange-800',
          textColor: 'text-orange-800 dark:text-orange-300',
        };
    }
  };

  const info = getQualityInfo();
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div
      className={`rounded-lg border p-4 ${info.bgColor} ${info.borderColor} mb-4 animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{info.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-medium ${info.textColor}`}>
              {info.title}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${info.bgColor} ${info.textColor} font-medium`}>
              {confidencePercent}% confidence
            </span>
          </div>
          
          {suggestions.length > 0 && (
            <div className={`text-sm ${info.textColor} space-y-1 mt-2`}>
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">•</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
          
          {quality === 'low' && onRetry && (
            <button
              onClick={onRetry}
              className={`mt-3 text-sm font-medium ${info.textColor} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-2 py-1`}
            >
              Try speaking again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}




