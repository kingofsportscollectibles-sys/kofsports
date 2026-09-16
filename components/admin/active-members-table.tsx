import type { BusinessMember } from "@/lib/admin/dashboard";

type ActiveMembersTableProps = {
  members: BusinessMember[];
};

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountInCents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ActiveMembersTable({
  members,
}: ActiveMembersTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
      <div className="flex flex-col gap-2 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Membership Health
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Active Members
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Premium Picks and standalone KofSports Pro memberships.
          </p>
        </div>

        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
          {members.length} active
        </div>
      </div>

      {members.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">
          No active paid members found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Last Sale</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
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

                  <td className="px-4 py-4">
                    <span
                      className={
                        member.product === "KofSports Pro"
                          ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300"
                          : "rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300"
                      }
                    >
                      {member.product}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {member.plan}
                  </td>

                  <td className="px-4 py-4 text-slate-400">
                    {formatLabel(member.source)}
                  </td>

                  <td className="px-4 py-4 text-slate-400">
                    {formatLabel(member.paymentMethod)}
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-200">
                    {member.amountInCents > 0
                      ? formatCurrency(member.amountInCents)
                      : "—"}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {formatDate(member.expiresAt)}
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
