"use client";

import { track } from "@vercel/analytics";

/**
 * Client-side Analytics Helper
 * 
 * For tracking user interactions in the browser.
 * Privacy-respecting - no PII collected.
 */

// Client-side events
export type ClientEvent =
  | "form_shared"
  | "form_exported"
  | "form_previewed"
  | "voice_input_used"
  | "ai_generation_started"
  | "theme_changed"
  | "template_selected";

export interface ClientEventProperties {
  shareMethod?: "link" | "embed" | "qr" | "email";
  exportFormat?: "csv" | "json" | "pdf";
  creationMethod?: "ai" | "voice" | "file" | "url" | "manual";
  templateType?: string;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Track a client-side event
 */
export function trackClientEvent(
  event: ClientEvent,
  properties?: ClientEventProperties
): void {
  try {
    track(event, properties);
  } catch (error) {
    // Never let analytics break the app
    console.error("[Analytics]", error);
  }
}
