/**
 * Simple Privacy Utilities
 */

/**
 * Mask an email address for display
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local[0]}***@${domain}`;
}

/**
 * Data retention periods (in days)
 */
export const RETENTION_POLICY = {
  submissions: 365,
  files: 90,
  voiceTranscriptions: 1,
};
