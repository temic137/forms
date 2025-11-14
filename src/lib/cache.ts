/**
 * Simple in-memory cache with TTL support
 */
class Cache<T> {
  private cache: Map<string, { value: T; expiresAt: number }> = new Map();

  set(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create cache instances for different AI features
export const aiResponseCache = new Cache<unknown>();

// Run cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    aiResponseCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Generate a cache key from request parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${JSON.stringify(params[key])}`)
    .join("|");
  
  return `${prefix}:${sortedParams}`;
}

/**
 * Cached fetch wrapper for AI requests
 */
export async function cachedAIRequest<T>(
  cacheKey: string,
  requestFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> {
  // Check cache first
  const cached = aiResponseCache.get(cacheKey);
  if (cached !== null) {
    return cached as T;
  }
  
  // Make request
  const result = await requestFn();
  
  // Store in cache
  aiResponseCache.set(cacheKey, result, ttlMs);
  
  return result;
}
