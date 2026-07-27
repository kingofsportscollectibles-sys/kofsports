import type { ActivityItem } from "@/lib/admin/dashboard";

function formatRelativeDate(date: string) {
  const difference = Math.max(Date.now() - new Date(date).getTime(), 0);
  const minutes = Math.floor(difference / 60_000);
  const hours = Math.floor(difference / 3_600_000);
  const days = Math.floor(difference / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Recent Activity</p>
      <h2 className="mt-3 text-2xl font-bold text-black">Business updates</h2>

      {items.length > 0 ? (
        <div className="mt-6 space-y-5">
          {items.map((item) => (
            <div key={item.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.type === "membership" ? "bg-emerald-500" : item.type === "result" ? "bg-blue-500" : "bg-amber-500"}`} />
                <div>
                  <p className="font-semibold text-black">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{item.description}</p>
                  <p className="mt-2 text-xs font-medium text-gray-400">{formatRelativeDate(item.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">No recent activity found.</p>
      )}
    </section>
  );
}
