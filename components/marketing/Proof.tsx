import Image from "next/image";
import {
  founderIdentity,
  memberStories,
  independentReview,
} from "@/lib/marketing/owner-content";
export function FounderIdentity() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      {founderIdentity.photo && (
        <Image
          src={founderIdentity.photo.src} alt={founderIdentity.photo.alt}
          width={80}
          height={80}
          className="rounded-full object-cover"
        />
      )}
      <div>
        <p className="font-semibold text-white">
          {founderIdentity.fullName ?? "Kof"} · Founder & lead handicapper
        </p>
        <a
          className="inline-flex min-h-11 items-center text-sm text-brand underline underline-offset-4"
          href="mailto:kof@kofsports.com"
        >
          Contact Kof
        </a>
        {founderIdentity.profiles.map((profile) => (
          <a
            key={profile.href}
            className="ml-4 inline-flex min-h-11 items-center text-sm text-brand underline"
            href={profile.href}
            rel="me"
          >
            {profile.label}
          </a>
        ))}
      </div>
    </div>
  );
}
export function MemberStories() {
  const published = memberStories.filter(
    (s) =>
      s.consentToPublish &&
      s.name.trim() &&
      s.quote.trim() &&
      s.context.trim() &&
      s.photo.src &&
      s.photo.alt,
  );
  if (!published.length) return null;
  return (
    <section
      aria-labelledby="member-stories"
      className="mx-auto max-w-7xl px-5 py-12 lg:px-8"
    >
      <h2
        id="member-stories"
        className="font-display text-3xl font-bold text-white"
      >
        From KofSports members
      </h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {published.map((s) => (
          <figure
            key={`${s.name}:${s.context}`}
            className="rounded-xl border border-white/10 p-6"
          >
            <blockquote className="leading-7 text-zinc-300">
              “{s.quote}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Image
                src={s.photo.src} alt={s.photo.alt}
                width={48}
                height={48}
                className="rounded-full"
              />
              <span>
                {s.name}
                <span className="block text-sm text-zinc-400">{s.context}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
export function IndependentReview() {
  const review = independentReview;
  if (!review) return null;
  return (
    <p className="mt-5 text-sm text-zinc-400">
      <a href={review.href} className="text-brand underline">
        {review.platform}: {review.rating}/5 from {review.count} reviews
      </a>{" "}
      · checked {review.checkedAt}
    </p>
  );
}
