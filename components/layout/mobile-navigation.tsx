"use client";

import Link from "next/link";
import { useState } from "react";

import type { HeaderUser } from "@/components/layout/site-header";
import { SignOutButton } from "@/components/layout/sign-out-button";

const navigation = [
  { name: "Free Picks", href: "/free-picks" },
  { name: "Premium Picks", href: "/premium-picks" },
  { name: "Results", href: "/results" },
  { name: "Plans", href: "/plans" },
  { name: "About", href: "/about" },
];

type MobileNavigationProps = {
  user: HeaderUser | null;
};

function formatExpirationDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function MobileNavigation({ user }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isPremium = user?.membership === "premium";
  const isAdmin = user?.role === "admin";
  const expirationDate = formatExpirationDate(
    user?.membershipExpiresAt ?? null,
  );

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
      >
        <span className="sr-only">
          {isOpen ? "Close menu" : "Open menu"}
        </span>

        <div className="flex w-5 flex-col gap-1.5">
          <span
            className={`h-0.5 w-full bg-current transition ${
              isOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />

          <span
            className={`h-0.5 w-full bg-current transition ${
              isOpen ? "opacity-0" : ""
            }`}
          />

          <span
            className={`h-0.5 w-full bg-current transition ${
              isOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="fixed inset-0 top-[73px] z-40 bg-black/70 backdrop-blur-sm"
          />

          <div
            id="mobile-navigation"
            className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-73px)] overflow-y-auto border-b border-white/10 bg-zinc-950 shadow-2xl"
          >
            <nav className="mx-auto max-w-7xl px-5 py-5">
              {user && (
                <div className="mb-5 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand font-display font-black uppercase text-black">
                      {user.displayName.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-white">
                          {user.displayName}
                        </p>

                        {isPremium && (
                          <span className="rounded bg-brand px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-black">
                            Premium
                          </span>
                        )}
                      </div>

                      {user.email && (
                        <p className="truncate text-xs text-zinc-500">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {isPremium && expirationDate && (
                    <p className="mt-3 border-t border-white/10 pt-3 text-xs text-zinc-400">
                      Premium access through {expirationDate}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMenu}
                    className="border-b border-white/10 py-4 font-display text-xl font-bold uppercase text-zinc-200 transition last:border-b-0 hover:text-brand"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {user ? (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <div className="grid gap-3">
                    <Link
                      href="/account"
                      onClick={closeMenu}
                      className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-extrabold uppercase text-white"
                    >
                      My Account
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className="rounded-md border border-brand/30 bg-brand/10 px-4 py-3 text-center text-sm font-extrabold uppercase text-brand"
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    {!isPremium && (
                      <Link
                        href="/plans"
                        onClick={closeMenu}
                        className="rounded-md bg-brand px-4 py-3 text-center text-sm font-extrabold uppercase text-black"
                      >
                        Upgrade to Premium
                      </Link>
                    )}

                    <SignOutButton
                      onSignedOut={closeMenu}
                      className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm font-extrabold uppercase text-red-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="rounded-md border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-extrabold uppercase text-white"
                  >
                    Log In
                  </Link>

                  <Link
                    href="/plans"
                    onClick={closeMenu}
                    className="rounded-md bg-brand px-4 py-3 text-center text-sm font-extrabold uppercase text-black"
                  >
                    Join Premium
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}