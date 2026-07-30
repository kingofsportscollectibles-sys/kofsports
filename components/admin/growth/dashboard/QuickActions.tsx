import Link from "next/link";

const actions = [
  {
    label: "Add New Lead",
    description: "Save a new social prospect.",
    href: "/admin/growth/leads",
  },
  {
    label: "Log Conversation",
    description: "Record a DM, reply, or comment.",
    href: "/admin/growth/conversations",
  },
  {
    label: "Review Follow-Ups",
    description: "Work through leads due today.",
    href: "/admin/growth/tasks",
  },
  {
    label: "Create Campaign",
    description: "Track a focused growth push.",
    href: "/admin/growth/campaigns",
  },
];

export default function QuickActions() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
          Take Action
        </p>

        <h3 className="mt-2 text-xl font-black text-slate-950">
          Quick Actions
        </h3>
      </div>

      <div className="mt-5 grid gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-400 hover:bg-emerald-50"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-900">
                  {action.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {action.description}
                </p>
              </div>

              <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
