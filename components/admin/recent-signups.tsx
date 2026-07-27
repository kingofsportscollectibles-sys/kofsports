import type { RecentSignup } from "@/lib/admin/dashboard";

function formatDate(value: string | null) {
  if (!value) return "—";
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

export function RecentSignups({ signups }: { signups: RecentSignup[] }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
        Recent Signups
      </p>
      <h2 className="mt-3 text-2xl font-bold text-black">Newest paying members</h2>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-400">
              <th className="pb-3 font-bold">Member</th>
              <th className="pb-3 font-bold">Plan</th>
              <th className="pb-3 font-bold">Paid</th>
              <th className="pb-3 font-bold">Joined</th>
              <th className="pb-3 font-bold">Expires</th>
            </tr>
          </thead>
          <tbody>
            {signups.map((signup) => (
              <tr key={signup.id} className="border-b border-gray-100 last:border-0">
                <td className="py-4 font-semibold text-black">{signup.name}</td>
                <td className="py-4 text-gray-600">{signup.plan}</td>
                <td className="py-4 font-semibold text-gray-800">
                  {formatCurrency(signup.amountInCents)}
                </td>
                <td className="py-4 text-gray-600">{formatDate(signup.joinedAt)}</td>
                <td className="py-4 text-gray-600">{formatDate(signup.expiresAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {signups.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
          No live paid signups found yet.
        </p>
      ) : null}
    </section>
  );
}
