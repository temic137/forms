"use client";

import { useEffect, useRef } from 'react';

/**
 * Props for ScreenReaderAnnouncement component
 */
export interface ScreenReaderAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number; // milliseconds
}

/**
 * Component for announcing messages to screen readers
 * 
 * Uses aria-live regions to announce dynamic content changes
 * without disrupting the user's current focus.
 * 
 * @param message - The message to announce
 * @param priority - The aria-live priority ('polite' or 'assertive')
 * @param clearAfter - Optional time in ms to clear the message after announcing
 */
export default function ScreenReaderAnnouncement({
  message,
  priority = 'polite',
  clearAfter,
}: ScreenReaderAnnouncementProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up auto-clear if specified
    if (clearAfter && message) {
      timeoutRef.current = setTimeout(() => {
        // Message will be cleared by parent component
      }, clearAfter);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Hook for managing screen reader announcements
 * 
 * Returns a function to announce messages and the current announcement state
 */
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = React.useState('');
  const [priority, setPriority] = React.useState<'polite' | 'assertive'>('polite');

  const announce = React.useCallback((message: string, announcementPriority: 'polite' | 'assertive' = 'polite') => {
    setPriority(announcementPriority);
    setAnnouncement(message);

    // Clear after a short delay to allow for new announcements
    setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  }, []);

  return {
    announcement,
    priority,
    announce,
  };
}

// Add React import for the hook
import React from 'react';
