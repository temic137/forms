"use client";

import { useState } from 'react';
import VoiceInputLazy from '@/components/voice/VoiceInputLazy';
import { performanceMonitor } from '@/lib/performanceMonitor';

/**
 * Performance test page for voice input optimizations
 * Demonstrates lazy loading, debouncing, and performance monitoring
 */
export default function PerformanceTestPage() {
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [metrics, setMetrics] = useState<string[]>([]);

  const handleToggleVoiceInput = () => {
    performanceMonitor.mark('voice-panel-toggle');
    setShowVoiceInput(!showVoiceInput);
    
    setTimeout(() => {
      const duration = performanceMonitor.measure('voice-panel-toggle');
      if (duration) {
        setMetrics(prev => [...prev, `Panel toggle: ${duration.toFixed(2)}ms`]);
      }
    }, 100);
  };

  const handleGenerateForm = async (transcript: string, language?: string) => {
    performanceMonitor.mark('form-generation');
    
    // Simulate form generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const duration = performanceMonitor.measure('form-generation');
    if (duration) {
      setMetrics(prev => [...prev, `Form generation: ${duration.toFixed(2)}ms`]);
    }
    
    console.log('Generated form from transcript:', transcript, 'Language:', language);
  };

  const clearMetrics = () => {
    setMetrics([]);
    performanceMonitor.clear();
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Voice Input Performance Test
          </h1>
          <p className="text-neutral-600">
            Test page to demonstrate and verify performance optimizations
          </p>
        </div>

        {/* Performance Metrics Display */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-black">Performance Metrics</h2>
            <button
              onClick={clearMetrics}
              className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
            >
              Clear
            </button>
          </div>
          
          {metrics.length === 0 ? (
            <p className="text-sm text-neutral-500 italic">
              No metrics recorded yet. Toggle voice input to see performance data.
            </p>
          ) : (
            <div className="space-y-2">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm font-mono"
                >
                  <span className="text-green-600">✓</span>
                  <span className="text-neutral-700">{metric}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optimization Features */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-black mb-4">
            Implemented Optimizations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OptimizationCard
              title="Debounced Updates"
              description="Interim transcriptions debounced by 100ms"
              status="active"
            />
            <OptimizationCard
              title="React.memo"
              description="Transcription display memoized"
              status="active"
            />
            <OptimizationCard
              title="Lazy Loading"
              description="Voice input loaded on demand"
              status={showVoiceInput ? 'loaded' : 'pending'}
            />
            <OptimizationCard
              title="Code Splitting"
              description="Separate bundle for voice features"
              status="active"
            />
            <OptimizationCard
              title="Optimized Audio"
              description="FFT size reduced to 128"
              status="active"
            />
            <OptimizationCard
              title="Performance Monitor"
              description="Real-time metric tracking"
              status="active"
            />
          </div>
        </div>

        {/* Toggle Button */}
        <div className="mb-6">
          <button
            onClick={handleToggleVoiceInput}
            className="w-full px-6 py-4 bg-black text-white rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors font-medium"
          >
            {showVoiceInput ? 'Hide Voice Input' : 'Show Voice Input (Lazy Loaded)'}
          </button>
          <p className="text-xs text-neutral-500 mt-2 text-center">
            {showVoiceInput 
              ? 'Voice input component is loaded and active'
              : 'Click to lazy load the voice input component'}
          </p>
        </div>

        {/* Voice Input Component (Lazy Loaded) */}
        {showVoiceInput && (
          <div className="animate-slide-in">
            <VoiceInputLazy
              onGenerateForm={handleGenerateForm}
              onTranscriptComplete={(transcript) => {
                console.log('Transcript updated:', transcript);
              }}
            />
          </div>
        )}

        {/* Performance Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Performance Testing Tips
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Open DevTools Performance tab to see detailed metrics</li>
            <li>• Watch for smooth 60 FPS during speech recognition</li>
            <li>• Check Network tab to see lazy loading in action</li>
            <li>• Monitor CPU usage - should stay under 5% during recording</li>
            <li>• Verify no long tasks (&gt; 50ms) during transcription</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface OptimizationCardProps {
  title: string;
  description: string;
  status: 'active' | 'loaded' | 'pending';
}

function OptimizationCard({ title, description, status }: OptimizationCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-700 border-green-200',
    loaded: 'bg-blue-100 text-blue-700 border-blue-200',
    pending: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  };

  const statusLabels = {
    active: 'Active',
    loaded: 'Loaded',
    pending: 'Pending',
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-black">{title}</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[status]}`}
        >
          {statusLabels[status]}
        </span>
      </div>
      <p className="text-sm text-neutral-600">{description}</p>
    </div>
  );
}
