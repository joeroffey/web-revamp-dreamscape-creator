// Single source of truth for business details used across the public site,
// structured data (schema.org) and the build-time pre-renderer.
// Keep these in sync with the Google Business Profile.

export const SITE_URL = "https://www.revitalisehub.co.uk";
export const SITE_NAME = "Revitalise Hub";
export const BUSINESS_ID = `${SITE_URL}/#business`;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/7213f936-2c10-4a80-a628-96054c5c6507.png`;

export const PHONE_DISPLAY = "01590 698691";
export const PHONE_TEL = "+441590698691";
export const EMAIL = "info@revitalisehub.co.uk";

export const ADDRESS = {
  line1: "Unit 7, Ensign Yard",
  line2: "670 Ampress Lane",
  town: "Lymington",
  county: "Hampshire",
  postcode: "SO41 8QY",
};

// Google Business Profile (place id looked up from Google Maps)
export const GOOGLE_PLACE_ID = "ChIJXSaDBACHc0gRwIiwiMiGK8I";
export const GOOGLE_REVIEWS_URL = `https://www.google.com/maps/place/?q=place_id:${GOOGLE_PLACE_ID}`;
export const GOOGLE_WRITE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`;

export const INSTAGRAM_URL = "https://www.instagram.com/revitalise.hub";
export const FACEBOOK_URL = "https://www.facebook.com/share/1Ak6ZqBrd1/";

export const OPENING_HOURS = [
  { days: "Tue – Sat", hours: "8:30am – 8:00pm" },
  { days: "Sunday", hours: "8:30am – 5:30pm" },
  { days: "Monday", hours: "Closed" },
];

export const absoluteUrl = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
