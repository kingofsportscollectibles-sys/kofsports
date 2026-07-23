import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SMS Terms & Conditions | KofSports",
  description:
    "Terms and conditions governing KofSports SMS Premium Pick notifications.",
};

export default function SmsTermsPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-black via-gray-900 to-black py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand">
            Legal
          </p>

          <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-white">
            SMS Terms &amp; Conditions
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            These terms govern the use of SMS notifications provided by
            KofSports to Premium members.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-10 text-gray-700">

          <div>
            <p className="text-sm text-gray-500">
              <strong>Effective Date:</strong> July 23, 2026
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Program Description
            </h2>

            <p className="mt-4 leading-7">
              By opting in to receive SMS notifications from KofSports, you
              agree to receive automated text messages related to your Premium
              membership.
            </p>

            <p className="mt-4 font-semibold text-gray-900">
              Messages may include:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
              <li>New Premium Pick alerts</li>
              <li>Updates to the current Premium Picks card</li>
              <li>Important account notifications</li>
              <li>Service-related announcements</li>
            </ul>

            <p className="mt-4 leading-7">
              Marketing or promotional SMS messages will only be sent if you
              separately consent to receive them.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Message Frequency
            </h2>

            <p className="mt-4 leading-7">
              Message frequency varies depending on Premium Pick activity,
              account activity, and notification preferences.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Message &amp; Data Rates
            </h2>

            <p className="mt-4 leading-7">
              Message and data rates may apply according to your wireless
              carrier's plan.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Opt-In
            </h2>

            <p className="mt-4 leading-7">
              Users explicitly opt in to receive SMS notifications by enabling
              SMS alerts within their KofSports Account Settings and providing a
              valid mobile phone number.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Opt-Out
            </h2>

            <p className="mt-4 leading-7">
              You may stop receiving SMS notifications at any time by replying{" "}
              <span className="rounded bg-gray-900 px-2 py-1 font-mono text-sm font-bold text-white">
                STOP
              </span>{" "}
              to any message.
            </p>

            <p className="mt-4 leading-7">
              After opting out, you will no longer receive SMS notifications
              unless you choose to opt in again.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Help
            </h2>

            <p className="mt-4 leading-7">
              For assistance, reply{" "}
              <span className="rounded bg-gray-900 px-2 py-1 font-mono text-sm font-bold text-white">
                HELP
              </span>{" "}
              or contact us at{" "}
              <a
                href="mailto:kofsports1@gmail.com"
                className="font-medium text-brand hover:underline"
              >
                kofsports1@gmail.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Privacy
            </h2>

            <p className="mt-4 leading-7">
              Your personal information is handled in accordance with the
              KofSports Privacy Policy.
            </p>

            <a
              href="/privacy"
              className="mt-4 inline-block font-semibold text-brand hover:underline"
            >
              View Privacy Policy →
            </a>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Eligibility
            </h2>

            <p className="mt-4 leading-7">
              By enrolling in SMS notifications, you represent that you are the
              authorized user of the mobile phone number provided or have the
              account holder's permission to receive messages.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Changes to These Terms
            </h2>

            <p className="mt-4 leading-7">
              KofSports reserves the right to modify or discontinue the SMS
              notification program at any time. Updated terms will be posted on
              this page and become effective immediately upon publication.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Contact
            </h2>

            <p className="mt-4 leading-7">
              Questions regarding these SMS Terms &amp; Conditions may be sent
              to{" "}
              <a
                href="mailto:kofsports1@gmail.com"
                className="font-medium text-brand hover:underline"
              >
                kofsports1@gmail.com
              </a>
              .
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}