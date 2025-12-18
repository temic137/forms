/**
 * Server-side Analytics Helper
 * 
 * Privacy-respecting event tracking using Vercel Analytics.
 * Only tracks aggregate actions - no personal data.
 */

// Event types we track
export type AnalyticsEvent = 
  | 'form_created'
  | 'form_submitted'
  | 'form_updated'
  | 'form_deleted'
  | 'form_viewed'
  | 'form_shared'
  | 'form_exported'
  | 'user_registered'
  | 'user_signed_in'
  | 'quiz_completed'
  | 'voice_form_created';

// Event properties (no PII allowed)
export interface EventProperties {
  // Form events
  formType?: string;        // 'survey' | 'quiz' | 'contact' | etc.
  fieldCount?: number;      // Number of fields in form
  hasQuizMode?: boolean;
  hasMultiStep?: boolean;
  isConversational?: boolean;
  
  // Submission events
  submissionMethod?: string; // 'direct' | 'embedded'
  quizScore?: number;       // Percentage score for quizzes
  
  // Creation method
  creationMethod?: string;  // 'ai' | 'manual' | 'template' | 'voice' | 'file' | 'url'
  
  // Export
  exportFormat?: string;    // 'csv' | 'json' | 'pdf'
  
  // Share
  shareMethod?: string;     // 'link' | 'embed' | 'qr' | 'email'
}

/**
 * Track an analytics event (server-side)
 * 
 * Uses Vercel's Web Analytics API when available,
 * falls back to console logging in development.
 */
export async function trackEvent(
  event: AnalyticsEvent, 
  properties?: EventProperties
): Promise<void> {
  // Skip in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_DEV_ANALYTICS) {
    console.log(`[Analytics] ${event}`, properties || '');
    return;
  }

  try {
    // Log to server console for your own records (optional)
    console.log(`[Analytics] ${event}`, JSON.stringify(properties || {}));
    
    // Note: Vercel Analytics automatically captures server-side events
    // when the Analytics component is mounted. For custom server events,
    // you would typically use a dedicated analytics service.
    
    // For now, we'll rely on the client-side tracking + server logs
    // If you need more advanced server analytics, consider:
    // - Vercel's Server Analytics (Pro plan)
    // - PostHog (open source, self-hostable)
    // - Plausible (privacy-focused)
    
  } catch (error) {
    // Never let analytics errors break the app
    console.error('[Analytics Error]', error);
  }
}

/**
 * Helper to extract non-PII form properties for tracking
 */
export function getFormProperties(form: {
  fieldsJson?: unknown[];
  quizMode?: unknown;
  multiStepConfig?: unknown;
  conversationalMode?: boolean;
}): EventProperties {
  const fields = Array.isArray(form.fieldsJson) ? form.fieldsJson : [];
  
  return {
    fieldCount: fields.length,
    hasQuizMode: !!form.quizMode,
    hasMultiStep: !!form.multiStepConfig,
    isConversational: !!form.conversationalMode,
  };
}
