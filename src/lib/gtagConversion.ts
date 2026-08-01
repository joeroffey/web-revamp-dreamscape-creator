// Google Ads conversion tracking helper
// Fires the AW-18133202512/NJNoCPaPl84cENDsysZD conversion once per transaction.
// Safe wrapper: if window.gtag is undefined, pushes to window.dataLayer instead
// so the event is queued for the existing Google tag (G-181WZFQL8F).

const CONVERSION_SEND_TO = "AW-18133202512/NJNoCPaPl84cENDsysZD";
const STORAGE_PREFIX = "gads_conv_fired:";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface ConversionPayload {
  /** Amount in GBP (pounds, not pence). */
  value: number;
  /** Unique transaction identifier used to dedupe across reloads. */
  transactionId?: string | null;
}

export function fireGoogleAdsConversion({ value, transactionId }: ConversionPayload) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(value) || value <= 0) return;

  const dedupeKey = `${STORAGE_PREFIX}${transactionId ?? `${CONVERSION_SEND_TO}:${value}`}`;
  try {
    if (window.sessionStorage.getItem(dedupeKey)) return;
    window.sessionStorage.setItem(dedupeKey, "1");
  } catch {
    // sessionStorage unavailable — proceed without dedupe.
  }

  const payload: Record<string, unknown> = {
    send_to: CONVERSION_SEND_TO,
    value,
    currency: "GBP",
  };
  if (transactionId) payload.transaction_id = transactionId;

  if (typeof window.gtag === "function") {
    window.gtag("event", "conversion", payload);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["event", "conversion", payload]);
  }
}
