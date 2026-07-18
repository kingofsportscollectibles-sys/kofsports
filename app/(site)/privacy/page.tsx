import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <section>
      <div className="mx-auto max-w-4xl px-5 py-20 lg:px-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
          Legal
        </p>

        <h1 className="mt-4 font-display text-5xl font-bold uppercase text-white">
          Privacy Policy
        </h1>

        <div className="mt-10 space-y-8 leading-7 text-zinc-400">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Information collected
            </h2>
            <p className="mt-3">
              KofSports may collect account information, contact information,
              membership status, payment-related identifiers, website usage
              information, and communications submitted by customers.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              How information is used
            </h2>
            <p className="mt-3">
              Information may be used to provide account access, process
              memberships, communicate with customers, protect the service,
              improve the website, and comply with applicable obligations.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Service providers
            </h2>
            <p className="mt-3">
              KofSports may use third-party hosting, authentication, analytics,
              email, content management, and payment services. The final policy
              will identify the relevant providers before customer accounts and
              payments are activated.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Policy status
            </h2>
            <p className="mt-3">
              This is an initial website-development version. A complete privacy
              policy will be finalized before the public commercial launch.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}