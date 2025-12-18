import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Detect if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  const userAgent = navigator.userAgent || navigator.vendor || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return mobileRegex.test(userAgent) || (hasTouch && window.innerWidth < 768);
}

/**
 * Detect if the current device is a touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Detect iOS Safari specifically
 */
export function isIOSSafari(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isWebkit = /WebKit/.test(userAgent);
  const isNotChrome = !/CriOS/.test(userAgent);
  
  return isIOS && isWebkit && isNotChrome;
}

/**
 * Check if the device supports haptic feedback
 */
function supportsHaptics(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'vibrate' in navigator;
}

/**
 * Check if wake lock API is supported
 */
function supportsWakeLock(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'wakeLock' in navigator;
}

/**
 * Haptic feedback patterns
 */
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [25, 50, 25],
  error: [50, 100, 50, 100, 50],
  warning: [25, 50, 25, 50],
};

/**
 * Custom hook for mobile-specific optimizations
 * - Haptic feedback
 * - Wake lock (screen on)
 * - Network status
 * - Device detection
 * - Viewport adjustments
 */
export function useMobileOptimizations() {
  // Initialize with actual values using lazy initialization
  const [isMobile] = useState(() => isMobileDevice());
  const [isTouch] = useState(() => isTouchDevice());
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isLandscape, setIsLandscape] = useState(() => typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false);
  const [hasHaptics] = useState(() => supportsHaptics());
  const [hasWakeLock] = useState(() => supportsWakeLock());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  // Set up event listeners on mount
  useEffect(() => {
    
    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Orientation/resize listener
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  /**
   * Trigger haptic feedback
   */
  const triggerHaptic = useCallback((pattern: HapticPattern = 'medium') => {
    if (!hasHaptics || !isMobile) return;
    
    try {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [hasHaptics, isMobile]);
  
  /**
   * Request wake lock to prevent screen from sleeping
   * Useful during voice recording
   */
  const requestWakeLock = useCallback(async () => {
    if (!hasWakeLock || wakeLockRef.current) return;
    
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      
      // Handle visibility change (re-acquire wake lock when page becomes visible)
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && wakeLockRef.current === null) {
          try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          } catch (err) {
            console.warn('Failed to re-acquire wake lock:', err);
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Listen for wake lock release
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } catch (error) {
      console.warn('Wake lock request failed:', error);
    }
  }, [hasWakeLock]);
  
  /**
   * Release wake lock
   */
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (error) {
        console.warn('Wake lock release failed:', error);
      }
    }
  }, []);
  
  // Clean up wake lock on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);
  
  /**
   * Get touch coordinates from touch event
   */
  const getTouchCoordinates = useCallback((e: TouchEvent | React.TouchEvent): { x: number; y: number } | null => {
    const touch = 'touches' in e ? e.touches[0] : null;
    if (!touch) return null;
    return { x: touch.clientX, y: touch.clientY };
  }, []);
  
  /**
   * Calculate touch distance for pinch gestures
   */
  const getTouchDistance = useCallback((e: TouchEvent | React.TouchEvent): number | null => {
    const touches = 'touches' in e ? e.touches : null;
    if (!touches || touches.length < 2) return null;
    
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);
  
  /**
   * Get optimized settings for mobile voice input
   */
  const getMobileVoiceSettings = useCallback(() => {
    return {
      // Shorter timeout on mobile to conserve battery
      noSpeechTimeout: isMobile ? 8000 : 10000,
      // More aggressive auto-restart on mobile
      maxRestartAttempts: isMobile ? 5 : 3,
      // Smaller audio buffer for better performance
      audioBufferSize: isMobile ? 64 : 128,
      // Lower sample rate on mobile
      sampleRate: isMobile ? 16000 : 44100,
    };
  }, [isMobile]);
  
  /**
   * Prevent default touch behaviors for specific elements
   * Useful for custom drag-and-drop
   */
  const preventDefaultTouch = useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);
  
  return {
    // Device detection
    isMobile,
    isTouch,
    isOnline,
    isLandscape,
    isIOS: typeof window !== 'undefined' && isIOSSafari(),
    
    // Capabilities
    hasHaptics,
    hasWakeLock,
    
    // Actions
    triggerHaptic,
    requestWakeLock,
    releaseWakeLock,
    
    // Touch helpers
    getTouchCoordinates,
    getTouchDistance,
    preventDefaultTouch,
    
    // Voice settings
    getMobileVoiceSettings,
  };
}

/**
 * Hook to handle responsive breakpoints
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    windowSize,
    isXs: windowSize.width < 480,
    isSm: windowSize.width >= 480 && windowSize.width < 640,
    isMd: windowSize.width >= 640 && windowSize.width < 768,
    isLg: windowSize.width >= 768 && windowSize.width < 1024,
    isXl: windowSize.width >= 1024,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
  };
}

/**
 * Hook to handle safe area insets (notch, home indicator, etc.)
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  
  useEffect(() => {
    const updateSafeArea = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      
      setSafeArea({
        top: parseInt(style.getPropertyValue('--sat') || '0', 10),
        right: parseInt(style.getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
        left: parseInt(style.getPropertyValue('--sal') || '0', 10),
      });
    };
    
    // Set CSS variables for safe area
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
    
    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);
  
  return safeArea;
}

export default useMobileOptimizations;
