import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SMS Terms & Conditions | KofSports",
  description:
    "Terms and conditions for KofSports SMS Premium Pick notifications.",
};

export default function SmsTermsPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-gray-200 bg-gradient-to-b from-black via-gray-900 to-black py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
            Legal
          </p>

          <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-white">
            SMS Terms &amp; Conditions
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            These terms govern the use of SMS notifications provided by
            KofSports to Premium members.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">
          <p>
            <strong>Effective Date:</strong> July 23, 2026
          </p>

          <h2>Program Description</h2>

          <p>
            By opting in to receive SMS notifications from KofSports, you agree
            to receive automated text messages related to your Premium
            membership.
          </p>

          <p>Messages may include:</p>

          <ul>
            <li>New Premium Pick alerts</li>
            <li>Updates to the current Premium card</li>
            <li>Important account notifications</li>
            <li>Service-related announcements</li>
          </ul>

          <p>
            Marketing or promotional SMS messages are not sent unless you
            separately consent to receive them.
          </p>

          <h2>Message Frequency</h2>

          <p>
            Message frequency varies depending on Premium Pick activity and your
            account.
          </p>

          <h2>Message &amp; Data Rates</h2>

          <p>
            Message and data rates may apply based on your wireless carrier and
            mobile plan.
          </p>

          <h2>Opt-In</h2>

          <p>
            SMS notifications are optional. Members choose to receive text
            alerts by enabling SMS notifications from their KofSports Account
            Settings and providing their mobile phone number.
          </p>

          <h2>Opt-Out</h2>

          <p>
            You may stop receiving SMS messages at any time by replying:
          </p>

          <p className="font-bold text-black">STOP</p>

          <p>
            After opting out, you will no longer receive SMS notifications
            unless you choose to opt in again.
          </p>

          <h2>Help</h2>

          <p>
            For assistance, reply:
          </p>

          <p className="font-bold text-black">HELP</p>

          <p>
            or contact us at{" "}
            <a
              href="mailto:kofsports1@gmail.com"
              className="text-amber-600 hover:text-amber-700"
            >
              kofsports1@gmail.com
            </a>
            .
          </p>

          <h2>Privacy</h2>

          <p>
            Your personal information is handled in accordance with our Privacy
            Policy.
          </p>

          <p>
            <a
              href="/privacy"
              className="font-semibold text-amber-600 hover:text-amber-700"
            >
              View our Privacy Policy
            </a>
          </p>

          <h2>Eligibility</h2>

          <p>
            By enrolling in SMS notifications, you represent that you are the
            authorized user of the mobile phone number provided or have the
            account holder's permission to receive messages.
          </p>

          <h2>Changes</h2>

          <p>
            KofSports reserves the right to modify or discontinue the SMS
            notification program at any time. Updated terms will be posted on
            this page.
          </p>

          <h2>Contact</h2>

          <p>
            Questions regarding these SMS Terms &amp; Conditions may be directed
            to{" "}
            <a
              href="mailto:kofsports1@gmail.com"
              className="text-amber-600 hover:text-amber-700"
            >
              kofsports1@gmail.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}