"use client";

import dynamic from 'next/dynamic';
import { VoiceInputProps } from './VoiceInput';

// Lazy load VoiceInput component for better performance
const VoiceInput = dynamic(() => import('./VoiceInput'), {
  loading: () => (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        <span className="text-sm text-gray-600">Loading voice input...</span>
      </div>
    </div>
  ),
  ssr: false,
});

export default function VoiceInputLazy(props: VoiceInputProps) {
  return <VoiceInput {...props} />;
}
