"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  { name: "Free Picks", href: "/free-picks" },
  { name: "VIP Picks", href: "/vip" },
  { name: "Results", href: "/results" },
  { name: "Plans", href: "/plans" },
  { name: "About", href: "/about" },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

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
            className="absolute left-0 right-0 top-full z-50 border-b border-white/10 bg-zinc-950 shadow-2xl"
          >
            <nav className="mx-auto max-w-7xl px-5 py-5">
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
                  Join VIP
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}