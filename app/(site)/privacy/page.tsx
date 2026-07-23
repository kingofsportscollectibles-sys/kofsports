import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | KofSports",
  description:
    "Learn how KofSports collects, uses, and protects your personal information.",
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
              Information We Collect
            </h2>

            <p className="mt-3">
              KofSports may collect personal information that you voluntarily
              provide, including your name, email address, account information,
              membership status, payment-related identifiers, and any
              information you submit through contact forms or customer support.
              We also collect limited technical information such as browser
              type, device information, IP address, and website usage data to
              improve our services.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              How We Use Your Information
            </h2>

            <p className="mt-3">
              Your information is used to create and manage your account,
              process memberships and payments, deliver premium content,
              communicate important updates, respond to support requests,
              improve website performance, analyze usage trends, and protect the
              integrity and security of the KofSports platform.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Service Providers
            </h2>

            <p className="mt-3">
              KofSports works with trusted third-party providers to operate the
              website and deliver our services. These providers may process
              limited personal information solely for the purpose of performing
              services on our behalf.
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">Vercel</strong> — Website hosting
                and application deployment.
              </li>
              <li>
                <strong className="text-white">Supabase</strong> — User
                authentication, account management, and database services.
              </li>
              <li>
                <strong className="text-white">Stripe</strong> — Secure payment
                processing and subscription management.
              </li>
              <li>
                <strong className="text-white">Sanity</strong> — Content
                management for articles and editorial content.
              </li>
              <li>
                <strong className="text-white">
                  Google Analytics & Microsoft Clarity
                </strong>{" "}
                — Website analytics and user experience insights used to improve
                site performance.
              </li>
            </ul>

            <p className="mt-4">
              We may add, replace, or remove service providers as our platform
              evolves. These providers are only given access to information
              necessary to perform their services.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Cookies & Analytics
            </h2>

            <p className="mt-3">
              KofSports uses cookies and similar technologies to remember user
              preferences, maintain secure sessions, analyze website traffic,
              and improve the overall user experience. You can manage or disable
              cookies through your browser settings, although some features of
              the website may not function properly.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Affiliate Disclosure
            </h2>

            <p className="mt-3">
              KofSports may participate in affiliate marketing programs.
              Certain links on this website may be affiliate links, meaning we
              may earn a commission if you register or make a purchase through
              those links at no additional cost to you. Affiliate relationships
              do not influence our opinions, analysis, or published selections.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Policy Updates
            </h2>

            <p className="mt-3">
              This Privacy Policy may be updated periodically to reflect changes
              to our services, technology, or legal requirements. Any updates
              will be posted on this page with immediate effect unless otherwise
              stated.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Contact
            </h2>

            <p className="mt-3">
              If you have any questions regarding this Privacy Policy or how
              your information is handled, please contact KofSports through the
              contact information provided on this website.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}