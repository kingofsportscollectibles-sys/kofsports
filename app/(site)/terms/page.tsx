import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <section>
      <div className="mx-auto max-w-4xl px-5 py-20 lg:px-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
          Legal
        </p>

        <h1 className="mt-4 font-display text-5xl font-bold uppercase text-white">
          Terms of Service
        </h1>

        <div className="mt-10 space-y-8 leading-7 text-zinc-400">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Informational service
            </h2>
            <p className="mt-3">
              KofSports provides sports-related information, opinions,
              analytics, selections, and entertainment. KofSports is not a
              sportsbook and does not accept or place wagers on behalf of
              customers.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              No guarantees
            </h2>
            <p className="mt-3">
              Past performance does not guarantee future results. Customers are
              responsible for their own betting decisions and assume all
              financial risk associated with those decisions.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Membership access
            </h2>
            <p className="mt-3">
              VIP content is intended solely for the paying member and may not
              be copied, redistributed, resold, publicly posted, or shared with
              other individuals.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Final terms pending
            </h2>
            <p className="mt-3">
              These preliminary terms will be expanded before paid checkout is
              activated. Final terms will include billing, renewal,
              cancellation, refund, account access, and prohibited-use
              provisions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}