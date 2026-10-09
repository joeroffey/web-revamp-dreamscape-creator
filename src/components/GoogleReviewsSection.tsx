import { Star, ExternalLink, PenLine } from "lucide-react";
import { GUEST_REVIEWS } from "@/content/reviews";
import { GOOGLE_REVIEWS_URL, GOOGLE_WRITE_REVIEW_URL } from "@/lib/site";

/**
 * Guest reviews. Shows the real reviews listed in src/content/reviews.ts (if
 * any) and always links to the Google Business Profile so visitors can read
 * every review and leave their own.
 */
export const GoogleReviewsSection = () => {
  const reviews = GUEST_REVIEWS.slice(0, 6);

  return (
    <section className="relative py-24 overflow-hidden" aria-labelledby="reviews-heading">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/e66be255-48c0-42a2-92bb-1f189a14976d.webp')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/80" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <span className="text-white/50 text-xs tracking-[0.3em] uppercase mb-4 block">Reviews</span>
        <h2 id="reviews-heading" className="text-4xl md:text-6xl font-bold text-white tracking-wider mb-6">
          WHAT OUR GUESTS SAY
        </h2>
        <p className="text-white/70 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-12">
          Don&apos;t just take our word for it — read what guests say about their visits on Google, and if
          you&apos;ve been to the hub, we&apos;d love to hear about your experience.
        </p>

        {reviews.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3 text-left mb-12">
            {reviews.map((review) => (
              <figure
                key={`${review.name}-${review.text.slice(0, 20)}`}
                className="relative backdrop-blur-md bg-white/10 border border-white/20 p-8 flex flex-col"
              >
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40" />
                <div className="flex gap-1 mb-4" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-white text-white" />
                  ))}
                </div>
                <blockquote className="text-white/85 text-sm leading-relaxed flex-1">“{review.text}”</blockquote>
                <figcaption className="mt-6 text-white text-sm tracking-wide">
                  {review.name}
                  {review.date && <span className="block text-white/50 text-xs mt-1">{review.date} · Google</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 px-8 py-3 rounded-full font-medium tracking-wide transition-colors"
          >
            Read our Google reviews <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href={GOOGLE_WRITE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-white/40 text-white hover:bg-white/10 px-8 py-3 rounded-full font-medium tracking-wide transition-colors"
          >
            <PenLine className="h-4 w-4" /> Leave a review
          </a>
        </div>
      </div>
    </section>
  );
};
