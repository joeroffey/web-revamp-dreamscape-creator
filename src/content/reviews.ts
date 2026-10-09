/**
 * Guest reviews shown in the "What our guests say" section on the homepage.
 *
 * Only add REAL reviews, word for word, from your Google Business Profile (or
 * reviews guests have given you permission to use). Copy the reviewer's name as
 * it appears on Google (first name + initial is fine) and the month/year.
 *
 * While this list is empty the section still shows, with buttons linking to
 * your Google reviews and to the "leave a review" form.
 *
 * Example:
 * {
 *   name: "Sarah M.",
 *   date: "September 2026",
 *   rating: 5,
 *   text: "Paste the review text here exactly as written on Google.",
 * },
 */

export interface GuestReview {
  name: string;
  date?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
}

export const GUEST_REVIEWS: GuestReview[] = [];
