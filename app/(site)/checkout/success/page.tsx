import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-3xl text-green-400">
            ✓
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-green-400">
            Payment Successful
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight">
            Welcome to KofSports Premium
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-300">
            Your payment was received. Your Premium access should be activated
            automatically within a few moments.
          </p>

          <div className="mt-8 rounded-xl border border-white/10 bg-black/30 p-5 text-left">
            <p className="font-semibold text-white">Your access includes:</p>

            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>• Full Premium pick details</li>
              <li>• Matchups, selections, odds, and units</li>
              <li>• KofSports analysis and notes</li>
              <li>• Access for the duration of your selected plan</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/premium-picks"
              className="rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200"
            >
              View Premium Picks
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-white/15 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Return Home
            </Link>
          </div>

          <p className="mt-6 text-xs leading-5 text-zinc-500">
            Refresh the Premium Picks page after a few seconds if your access
            does not appear immediately.
          </p>
        </div>
      </div>
    </main>
  );
}