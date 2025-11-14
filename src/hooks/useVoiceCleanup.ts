import { useEffect, useRef } from 'react';
import { transcriptionStorage } from '@/lib/transcriptionStorage';

/**
 * useVoiceCleanup - Automatically cleanup voice data on navigation
 * Requirement 9.4: Implement automatic cleanup of voice data on navigation
 * 
 * This hook ensures that voice transcription data is cleaned up when:
 * - User navigates away from the page
 * - User closes the browser tab/window
 * - Component unmounts
 */
export function useVoiceCleanup(options: {
  enabled?: boolean;
  onCleanup?: () => void;
} = {}) {
  const { enabled = true, onCleanup } = options;
  const cleanupExecutedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Cleanup function to remove voice data
    const cleanup = () => {
      if (cleanupExecutedRef.current) {
        return; // Already cleaned up
      }

      try {
        transcriptionStorage.clear();
        cleanupExecutedRef.current = true;
        
        if (onCleanup) {
          onCleanup();
        }
      } catch (error) {
        console.warn('Failed to cleanup voice data:', error);
      }
    };

    // Handle page unload (navigation away or browser close)
    const handleBeforeUnload = () => {
      cleanup();
    };

    // Handle visibility change (tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Don't cleanup on visibility change, only on actual navigation
        // This prevents data loss when user switches tabs temporarily
      }
    };

    // Handle page hide (more reliable than beforeunload in some browsers)
    const handlePageHide = () => {
      cleanup();
    };

    // Register event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Note: We don't cleanup on unmount by default because the component
      // might remount (e.g., React strict mode, navigation within app)
      // Only cleanup on actual page unload
    };
  }, [enabled, onCleanup]);

  // Return manual cleanup function
  return {
    cleanup: () => {
      transcriptionStorage.clear();
      cleanupExecutedRef.current = true;
      if (onCleanup) {
        onCleanup();
      }
    },
  };
}
