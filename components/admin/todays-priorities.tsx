import Link from "next/link";
import type { PriorityItem } from "@/lib/admin/dashboard";

export function TodaysPriorities({ items }: { items: PriorityItem[] }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-black p-6 text-white shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
        Today&apos;s Priorities
      </p>
      <h2 className="mt-3 text-2xl font-bold">What needs attention</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {items.slice(0, 3).map((item) => {
          const dot =
            item.severity === "high"
              ? "bg-red-500"
              : item.severity === "medium"
                ? "bg-amber-400"
                : "bg-emerald-500";

          const content = (
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                <div>
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-300">{item.description}</p>
                </div>
              </div>
            </div>
          );

          return item.href ? (
            <Link key={item.id} href={item.href}>{content}</Link>
          ) : (
            <div key={item.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
