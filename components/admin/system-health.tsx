import type { SystemHealthItem } from "@/lib/admin/dashboard";

export function SystemHealth({ items }: { items: SystemHealthItem[] }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
        System Health
      </p>
      <h2 className="mt-3 text-2xl font-bold text-black">Connected services</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.name} className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${item.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
              <p className="font-bold text-black">{item.name}</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
