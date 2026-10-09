// Helpers for the public events page. Event dates are entered in the admin
// area as free text (e.g. "Saturday 12th September"), so they are parsed here
// to split upcoming dates from past ones and to build Event structured data.

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const DAY_MS = 24 * 60 * 60 * 1000;

const monthIndex = (word: string) => {
  const w = word.toLowerCase();
  if (w.length < 3) return -1;
  return MONTHS.findIndex((m) => m.startsWith(w.slice(0, 3)));
};

/**
 * Parses a free-text event date such as "Saturday 12th September",
 * "12 Sept 2026" or "September 12". When no year is given, the year the event
 * was last edited is assumed — or, when a weekday is given, the nearest year in
 * which the date falls on that weekday. Returns null if unrecognised.
 */
export const parseEventDate = (text: string, createdAt?: string | null): Date | null => {
  if (!text) return null;
  const clean = text.replace(/(\d+)(st|nd|rd|th)\b/gi, "$1").replace(/[,.]/g, " ");
  const yearMatch = clean.match(/\b(20\d{2})\b/);

  let day: number | null = null;
  let month = -1;
  let m = clean.match(/\b(\d{1,2})\s+([A-Za-z]{3,})/); // 12 September
  if (m && monthIndex(m[2]) >= 0) {
    day = Number(m[1]);
    month = monthIndex(m[2]);
  } else {
    m = clean.match(/\b([A-Za-z]{3,})\s+(\d{1,2})\b/); // September 12
    if (m && monthIndex(m[1]) >= 0) {
      day = Number(m[2]);
      month = monthIndex(m[1]);
    }
  }
  if (day === null || month < 0 || day < 1 || day > 31) return null;

  const created = createdAt ? new Date(createdAt) : null;
  const createdValid = created && !Number.isNaN(created.getTime());
  let year = yearMatch ? Number(yearMatch[1]) : createdValid ? created!.getFullYear() : new Date().getFullYear();
  let date = new Date(year, month, day);
  if (date.getMonth() !== month) return null; // e.g. 31 June

  if (!yearMatch) {
    // A weekday ("Saturday 12th September") pins down the year: pick the
    // nearest year to the reference date where that date falls on that day.
    const weekday = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d.slice(0, 3)}`, "i").test(clean));
    const ref = createdValid ? created!.getTime() : Date.now();
    const matches = [year - 1, year, year + 1, year + 2]
      .map((y) => new Date(y, month, day))
      .filter((d) => d.getMonth() === month && (weekday < 0 || d.getDay() === weekday));
    if (weekday >= 0 && matches.length > 0) {
      matches.sort((a, b) => Math.abs(a.getTime() - ref) - Math.abs(b.getTime() - ref));
      return matches[0];
    }
    if (createdValid && date.getTime() < ref - 30 * DAY_MS) {
      year += 1;
      date = new Date(year, month, day);
    }
  }
  return date;
};

/** First time in a string such as "6:30pm", "18:30" or "7pm – 9pm" → [hours, minutes]. */
export const parseEventTime = (text?: string | null): [number, number] | null => {
  if (!text) return null;
  const m = text.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\b/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  const meridiem = m[3]?.toLowerCase();
  if (!meridiem && !m[2]) return null; // a bare number isn't a time
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return [hours, minutes];
};

const pad = (n: number) => String(n).padStart(2, "0");

/** UK offset ("+00:00" or "+01:00") for a given calendar date. */
const londonOffset = (date: Date) => {
  try {
    const name = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "shortOffset" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value;
    return name === "GMT+1" ? "+01:00" : "+00:00";
  } catch {
    return "+00:00";
  }
};

/** ISO 8601 start date for structured data, with time and UK offset when known. */
export const toSchemaDate = (date: Date, time?: string | null) => {
  const ymd = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const t = parseEventTime(time);
  if (!t) return ymd;
  return `${ymd}T${pad(t[0])}:${pad(t[1])}:00${londonOffset(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12))}`;
};

export interface DatedEvent {
  event_dates: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Splits an event's dates into upcoming and past. Dates that can't be parsed
 * are treated as upcoming so nothing is hidden by mistake.
 */
export const splitEventDates = (event: DatedEvent, now: Date = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const upcoming: { label: string; date: Date | null }[] = [];
  const past: { label: string; date: Date }[] = [];
  for (const label of event.event_dates ?? []) {
    const date = parseEventDate(label, event.updated_at || event.created_at);
    if (date && date.getTime() < today) past.push({ label, date });
    else upcoming.push({ label, date });
  }
  return { upcoming, past };
};
