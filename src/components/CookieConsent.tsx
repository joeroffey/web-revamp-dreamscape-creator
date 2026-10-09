import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { OPEN_SETTINGS_EVENT, readConsent, saveConsent } from "@/lib/consent";

/**
 * Cookie banner for the public website. Shown until the visitor makes a
 * choice; "Cookie settings" in the footer re-opens it so consent can be
 * changed or withdrawn at any time.
 */
export const CookieConsent = () => {
  const [open, setOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Only decided in the browser, so it never appears in the pre-rendered HTML.
    const saved = readConsent();
    if (saved) {
      setAnalytics(saved.analytics);
      setMarketing(saved.marketing);
    } else {
      setOpen(true);
    }

    const reopen = () => {
      const current = readConsent();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setShowOptions(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (allowAnalytics: boolean, allowMarketing: boolean) => {
    setOpen(false);
    setShowOptions(false);
    saveConsent(allowAnalytics, allowMarketing);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-3 bottom-3 z-[60] sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-md rounded-2xl border border-border bg-background/95 backdrop-blur-sm p-5 sm:p-6 text-foreground shadow-[0_12px_40px_hsl(var(--foreground)/0.18)]"
    >
      <p id="cookie-consent-title" className="text-xs font-medium tracking-[0.25em] uppercase text-foreground/70 mb-3">
        Cookies
      </p>
      <p className="text-sm leading-relaxed text-foreground/85">
        We use essential cookies to make this website work. With your permission we&apos;d also like to use
        analytics cookies to see how the site is used, and marketing cookies to measure our adverts. Read our{" "}
        <Link to="/cookie-policy" className="underline underline-offset-4 hover:text-foreground">
          cookie policy
        </Link>
        .
      </p>

      {showOptions && (
        <div className="mt-5 space-y-4 border-t border-border/70 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Essential</p>
              <p className="text-xs text-foreground/70 mt-0.5">Needed for booking, sign-in and security. Always on.</p>
            </div>
            <Switch checked disabled aria-label="Essential cookies (always on)" />
          </div>
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="consent-analytics" className="cursor-pointer">
              <span className="block text-sm font-medium">Analytics</span>
              <span className="block text-xs text-foreground/70 mt-0.5">
                Google Analytics and Microsoft Clarity — how visitors use the site.
              </span>
            </label>
            <Switch id="consent-analytics" checked={analytics} onCheckedChange={setAnalytics} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="consent-marketing" className="cursor-pointer">
              <span className="block text-sm font-medium">Marketing</span>
              <span className="block text-xs text-foreground/70 mt-0.5">
                Google Ads — measuring which adverts lead to bookings.
              </span>
            </label>
            <Switch id="consent-marketing" checked={marketing} onCheckedChange={setMarketing} />
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {showOptions ? (
          <button
            type="button"
            onClick={() => choose(analytics, marketing)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Save choices
          </button>
        ) : (
          <button
            type="button"
            onClick={() => choose(true, true)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Accept all
          </button>
        )}
        <button
          type="button"
          onClick={() => choose(false, false)}
          className="rounded-full border border-foreground/30 px-5 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
        >
          Reject all
        </button>
        {!showOptions && (
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            className="ml-auto text-sm underline underline-offset-4 text-foreground/80 hover:text-foreground"
          >
            Manage
          </button>
        )}
      </div>
    </div>
  );
};
