"use client";

import { lazy, Suspense } from 'react';
import type { VoiceInputProps } from './VoiceInput';

/**
 * Lazy-loaded VoiceInput component for code splitting
 * 
 * Requirement 12.3: Implement lazy loading for voice input components
 * Requirement 12.4: Add code splitting for voice feature bundle
 */
const VoiceInputComponent = lazy(() => import('./VoiceInput'));

/**
 * Loading fallback component for voice input
 */
function VoiceInputLoading() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-neutral-200 rounded" />
        <div className="h-8 w-24 bg-neutral-200 rounded" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-40 bg-neutral-200 rounded-lg" />
        <div className="h-10 w-20 bg-neutral-200 rounded-lg" />
      </div>
      <div className="mb-4">
        <div className="h-4 w-24 bg-neutral-200 rounded mb-2" />
        <div className="h-48 bg-neutral-200 rounded-lg" />
      </div>
      <div className="h-12 bg-neutral-200 rounded-lg" />
    </div>
  );
}

/**
 * Lazy-loaded VoiceInput wrapper with Suspense boundary
 */
export default function VoiceInputLazy(props: VoiceInputProps) {
  return (
    <Suspense fallback={<VoiceInputLoading />}>
      <VoiceInputComponent {...props} />
    </Suspense>
  );
}
