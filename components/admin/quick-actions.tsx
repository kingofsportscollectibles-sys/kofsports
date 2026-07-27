import Link from "next/link";

const actions = [
  { href: "/admin/picks/new", title: "Publish Pick", description: "Release a new Premium selection." },
  { href: "/studio", title: "Write Article", description: "Open Sanity Studio and publish content." },
  { href: "/admin/results", title: "Grade Results", description: "Update wins, losses, pushes, and units." },
  { href: "/admin/members", title: "View Members", description: "Review access and subscription status." },
];

export function QuickActions() {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
        Quick Actions
      </p>
      <h2 className="mt-3 text-2xl font-bold text-black">Manage KofSports</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
          >
            <p className="font-black text-black transition group-hover:text-amber-700">
              {action.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-500">{action.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
