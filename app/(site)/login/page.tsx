import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Member Login",
};

export default function LoginPage() {
  return (
    <section>
      <div className="mx-auto flex min-h-[680px] max-w-7xl items-center justify-center px-5 py-20 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-8">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-brand">
              KofSports VIP
            </p>

            <h1 className="mt-3 font-display text-4xl font-bold uppercase text-white">
              Member Login
            </h1>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Authentication will be connected to Supabase in an upcoming
              build.
            </p>
          </div>

          <form className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-bold text-zinc-300"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                disabled
                placeholder="you@example.com"
                className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-bold text-zinc-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                disabled
                placeholder="••••••••"
                className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-md bg-brand/50 px-5 py-3.5 text-sm font-extrabold uppercase text-black"
            >
              Login Coming Soon
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-zinc-500">
            Need access?{" "}
            <Link href="/plans" className="font-bold text-brand">
              View VIP plans
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}