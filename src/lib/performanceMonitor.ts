/**
 * Performance monitoring utilities for voice input feature
 * Tracks key performance metrics to ensure optimizations are effective
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (!this.enabled || typeof performance === 'undefined') return;
    performance.mark(`${name}-start`);
  }

  /**
   * Mark the end of a performance measurement and calculate duration
   */
  measure(name: string): number | null {
    if (!this.enabled || typeof performance === 'undefined') return null;

    try {
      performance.mark(`${name}-end`);
      const measure = performance.measure(name, `${name}-start`, `${name}-end`);
      
      const metric: PerformanceMetric = {
        name,
        value: measure.duration,
        timestamp: Date.now(),
      };
      
      this.metrics.push(metric);
      
      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
      
      // Clean up marks
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
      
      return measure.duration;
    } catch (error) {
      console.warn(`Failed to measure performance for ${name}:`, error);
      return null;
    }
  }

  /**
   * Record a custom metric value
   */
  record(name: string, value: number): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
    };
    
    this.metrics.push(metric);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}`);
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get average value for a specific metric
   */
  getAverage(name: string): number | null {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return null;
    
    const sum = filtered.reduce((acc, m) => acc + m.value, 0);
    return sum / filtered.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook-style wrapper for performance monitoring
 */
export function usePerformanceMonitor() {
  return {
    mark: (name: string) => performanceMonitor.mark(name),
    measure: (name: string) => performanceMonitor.measure(name),
    record: (name: string, value: number) => performanceMonitor.record(name, value),
  };
}
