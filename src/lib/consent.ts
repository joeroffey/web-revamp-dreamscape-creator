// Cookie consent (UK GDPR / PECR) with Google Consent Mode v2.
//
// index.html sets every consent signal to "denied" before any Google tag runs,
// re-applies a saved choice on each page load, and only loads Google Tag
// Manager (which also carries Microsoft Clarity) once the visitor has agreed.
// This module saves the visitor's choice and applies it straight away.

export interface ConsentChoice {
  v: 1;
  analytics: boolean;
  marketing: boolean;
  /** ISO date the choice was made (kept as a record of consent) */
  date: string;
}

const STORAGE_KEY = "rh-consent";
export const OPEN_SETTINGS_EVENT = "rh-open-cookie-settings";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    rhLoadTags?: () => void;
  }
}

export const readConsent = (): ConsentChoice | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.v === 1 ? (parsed as ConsentChoice) : null;
  } catch {
    return null;
  }
};

/** Analytics/advertising cookies set on our own domain. */
const TRACKING_COOKIE = /^(_ga|_gid|_gat|_gcl_|_clck|_clsk|_uetsid|_uetvid|_fbp)/;

const clearTrackingCookies = () => {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !TRACKING_COOKIE.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
};

export const saveConsent = (analytics: boolean, marketing: boolean) => {
  const previous = readConsent();
  const choice: ConsentChoice = { v: 1, analytics, marketing, date: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  } catch {
    // Storage blocked — the choice still applies for this page view.
  }

  const state = (granted: boolean) => (granted ? "granted" : "denied");
  const update = {
    analytics_storage: state(analytics),
    ad_storage: state(marketing),
    ad_user_data: state(marketing),
    ad_personalization: state(marketing),
  };
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", update);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["consent", "update", update]);
  }

  if (analytics || marketing) {
    window.rhLoadTags?.();
  }

  // Consent withdrawn: remove existing tracking cookies and reload so any
  // scripts that already started are stopped.
  const withdrawn =
    previous && ((previous.analytics && !analytics) || (previous.marketing && !marketing));
  if (withdrawn) {
    clearTrackingCookies();
    window.location.reload();
  }
};

export const openCookieSettings = () => {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
};
