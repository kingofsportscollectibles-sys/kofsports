"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin/growth",
    icon: "◫",
  },
  {
    label: "Leads",
    href: "/admin/growth/leads",
    icon: "◎",
  },
  {
    label: "Conversations",
    href: "/admin/growth/conversations",
    icon: "◌",
  },
  {
  label: "Sales",
  href: "/admin/sales",
},
  {
    label: "Tasks",
    href: "/admin/growth/tasks",
    icon: "✓",
  },
  {
    label: "Campaigns",
    href: "/admin/growth/campaigns",
    icon: "◇",
  },
  {
    label: "Analytics",
    href: "/admin/growth/analytics",
    icon: "↗",
  },
  {
    label: "Settings",
    href: "/admin/growth/settings",
    icon: "⚙",
  },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/admin/growth") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export default function GrowthSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-slate-800 bg-slate-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-800 px-6 py-6">
        <Link href="/admin/growth" className="block">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">
            KofSports
          </p>

          <h1 className="mt-2 text-xl font-black tracking-tight">
            Growth OS
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Social growth command center
          </p>
        </Link>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 py-4 lg:flex-1 lg:flex-col lg:overflow-visible">
        {navigation.map((item) => {
          const active = isActiveRoute(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                active
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center text-base"
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-800 p-4 lg:block">
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Main Admin
        </Link>
      </div>
    </aside>
  );
}
