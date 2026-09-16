import type { ExpiredMember } from "@/lib/admin/dashboard";

type RecentlyExpiredMembersProps = {
  members: ExpiredMember[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountInCents / 100);
}

export function RecentlyExpiredMembers({
  members,
}: RecentlyExpiredMembersProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
          Win-Back Opportunities
        </p>

        <h2 className="mt-1 text-xl font-semibold text-white">
          Recently Expired
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Members whose access expired during the last 30 days.
        </p>
      </div>

      {members.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">
          No memberships expired during the last 30 days.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Last Sale</th>
                <th className="px-4 py-3 font-semibold">Expired</th>
                <th className="px-4 py-3 font-semibold">Days Ago</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="transition hover:bg-slate-900/40"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">
                      {member.name}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {member.email || "No email"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {member.product}
                  </td>

                  <td className="px-4 py-4 text-slate-400">
                    {member.plan}
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-200">
                    {member.amountInCents > 0
                      ? formatCurrency(member.amountInCents)
                      : "—"}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {formatDate(member.expiredAt)}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300">
                      {member.daysSinceExpiration}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
