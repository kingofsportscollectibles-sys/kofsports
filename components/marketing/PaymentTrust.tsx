import Link from "next/link";
import { approvedRefundStatement } from "@/lib/marketing/owner-content";
export function PaymentTrust() {
  return (
    <div className="mt-4 space-y-2 text-xs leading-5 text-zinc-400">
      <p>
        Secure checkout through Stripe. We use your account and payment
        identifiers to manage access.{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          How we handle your data
        </Link>
        .
      </p>
      {approvedRefundStatement ? (
        <p>{approvedRefundStatement}</p>
      ) : (
        <p>
          Questions about billing or refunds?{" "}
          <a
            href="mailto:kof@kofsports.com?subject=Membership%20question"
            className="underline underline-offset-4"
          >
            Ask Kof before you buy
          </a>
          .
        </p>
      )}
    </div>
  );
}
