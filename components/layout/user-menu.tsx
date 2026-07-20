"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { HeaderUser } from "@/components/layout/site-header";
import { SignOutButton } from "@/components/layout/sign-out-button";

type UserMenuProps = {
  user: HeaderUser;
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

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPremium = user.membership === "premium";
  const isAdmin = user.role === "admin";
  const expirationDate = formatExpirationDate(user.membershipExpiresAt);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 hover:bg-white/10"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-display text-sm font-black uppercase text-black">
          {user.displayName.charAt(0)}
        </div>

        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="max-w-32 truncate text-sm font-bold text-white">
              {user.displayName}
            </span>

            {isPremium && (
              <span className="rounded bg-brand px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-black">
                Premium
              </span>
            )}
          </div>

          <p className="text-[11px] text-zinc-500">
            {isAdmin
              ? "Administrator"
              : isPremium
                ? "Premium Member"
                : "Free Member"}
          </p>
        </div>

        <span
          aria-hidden="true"
          className={`text-xs text-zinc-500 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-64 overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-2xl"
        >
          <div className="border-b border-white/10 px-4 py-4">
            <p className="truncate font-semibold text-white">
              {user.displayName}
            </p>

            {user.email && (
              <p className="mt-1 truncate text-xs text-zinc-500">
                {user.email}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span
                className={`rounded px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                  isPremium
                    ? "bg-brand text-black"
                    : "bg-white/10 text-zinc-300"
                }`}
              >
                {isPremium ? "Premium Member" : "Free Member"}
              </span>
            </div>

            {isPremium && expirationDate && (
              <p className="mt-2 text-xs text-zinc-500">
                Access through {expirationDate}
              </p>
            )}
          </div>

          <div className="p-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/premium-picks"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              Premium Picks
            </Link>

            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              My Account
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/10"
              >
                Admin Dashboard
              </Link>
            )}

            {!isPremium && (
              <Link
                href="/plans"
                onClick={() => setIsOpen(false)}
                className="mt-1 block rounded-md bg-brand px-3 py-2.5 text-center text-sm font-extrabold text-black transition hover:bg-brand-light"
              >
                Upgrade to Premium
              </Link>
            )}
          </div>

          <div className="border-t border-white/10 p-2">
            <SignOutButton
              onSignedOut={() => setIsOpen(false)}
              className="w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}