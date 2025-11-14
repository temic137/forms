"use client";

import { useState } from 'react';
import VoiceInput from '@/components/VoiceInput';
import BrowserCompatibilityWarning from '@/components/BrowserCompatibilityWarning';
import MicrophonePermissionPrompt from '@/components/MicrophonePermissionPrompt';
import { SpeechRecognitionService } from '@/lib/speechRecognition';
import Link from 'next/link';

export default function VoiceTestPage() {
  const [transcript, setTranscript] = useState('');
  const [generatedForm, setGeneratedForm] = useState<string | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showCompatibilityDemo, setShowCompatibilityDemo] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<string>('');
  
  const service = new SpeechRecognitionService();
  const browserSupport = service.detectBrowserSupport();

  const handleTranscriptComplete = (newTranscript: string) => {
    setTranscript(newTranscript);
    console.log('Transcript updated:', newTranscript);
  };

  const handleGenerateForm = async (transcriptText: string) => {
    console.log('Generating form from:', transcriptText);
    
    // Simulate form generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGeneratedForm(`Form generated from: "${transcriptText}"`);
  };
  
  const handleRequestPermission = async () => {
    // Simulate permission request
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setShowPermissionPrompt(false);
      alert('Microphone permission granted!');
    } catch {
      throw new Error('Permission denied');
    }
  };

  const checkSessionStorage = () => {
    const session = localStorage.getItem('voice_transcription_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        const age = Date.now() - parsed.timestamp;
        const ageMinutes = Math.floor(age / 60000);
        setSessionInfo(`Session found: ${parsed.transcript.substring(0, 50)}... (${ageMinutes} minutes old)`);
      } catch {
        setSessionInfo('Invalid session data found');
      }
    } else {
      setSessionInfo('No session found in storage');
    }
  };

  const clearSessionStorage = () => {
    localStorage.removeItem('voice_transcription_session');
    setSessionInfo('Session cleared');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-light text-black mb-2">Voice Input Test</h1>
              <p className="text-neutral-600">
                Test the voice input component with speech recognition and error handling
              </p>
            </div>
            <Link
              href="/voice-stats"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
            >
              View Statistics
            </Link>
          </div>
        </div>
        
        {/* Test Controls */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-normal text-black mb-4">Test Controls</h2>
          
          {/* Error Handling Demos */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Error Handling Demos</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowPermissionPrompt(!showPermissionPrompt)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {showPermissionPrompt ? 'Hide' : 'Show'} Permission Prompt
              </button>
              <button
                onClick={() => setShowCompatibilityDemo(!showCompatibilityDemo)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
              >
                {showCompatibilityDemo ? 'Hide' : 'Show'} Compatibility Warning
              </button>
            </div>
          </div>

          {/* Session Restoration Testing */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Session Restoration Testing</h3>
            <div className="flex flex-wrap gap-3 mb-3">
              <button
                onClick={checkSessionStorage}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Check Session Storage
              </button>
              <button
                onClick={clearSessionStorage}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Clear Session Storage
              </button>
            </div>
            {sessionInfo && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900">
                {sessionInfo}
              </div>
            )}
            <p className="text-xs text-neutral-500 mt-2">
              💡 Tip: Type some text, refresh the page, and see if it restores automatically
            </p>
          </div>
          
          {/* Browser Support Info */}
          <div className="mt-4 p-3 bg-neutral-50 rounded border border-neutral-200">
            <p className="text-xs font-semibold text-neutral-900 mb-2">Browser Support Status:</p>
            <ul className="text-xs text-neutral-700 space-y-1">
              <li>Speech Recognition: {browserSupport.speechRecognition ? '✅ Supported' : '❌ Not Supported'}</li>
              <li>Web Audio API: {browserSupport.webAudioAPI ? '✅ Supported' : '❌ Not Supported'}</li>
              <li>Local Storage: {browserSupport.localStorage ? '✅ Supported' : '❌ Not Supported'}</li>
              {browserSupport.recommendedBrowser && (
                <li className="text-amber-700">Recommended: {browserSupport.recommendedBrowser}</li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Permission Prompt Demo */}
        {showPermissionPrompt && (
          <div className="mb-8">
            <MicrophonePermissionPrompt
              onRequestPermission={handleRequestPermission}
              onCancel={() => setShowPermissionPrompt(false)}
            />
          </div>
        )}
        
        {/* Compatibility Warning Demo */}
        {showCompatibilityDemo && (
          <div className="mb-8">
            <BrowserCompatibilityWarning
              support={{
                speechRecognition: false,
                webAudioAPI: true,
                localStorage: true,
                recommendedBrowser: 'Chrome or Edge',
              }}
              onDismiss={() => setShowCompatibilityDemo(false)}
            />
          </div>
        )}

        <div className="mb-8">
          <VoiceInput
            onTranscriptComplete={handleTranscriptComplete}
            onGenerateForm={handleGenerateForm}
          />
        </div>

        {transcript && (
          <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-normal text-black mb-3">Current Transcript</h2>
            <p className="text-sm text-neutral-700">{transcript}</p>
          </div>
        )}

        {generatedForm && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-normal text-green-900 mb-3">Generated Form</h2>
            <p className="text-sm text-green-800">{generatedForm}</p>
          </div>
        )}
      </div>
    </div>
  );
}
