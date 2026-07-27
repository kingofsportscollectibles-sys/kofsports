import type { NotificationHealth } from "@/lib/admin/dashboard";

export function NotificationStatus({ data }: { data: NotificationHealth }) {
  const channels = [
    {
      name: "Email",
      provider: data.emailProvider,
      configured: data.emailConfigured,
    },
    {
      name: "SMS",
      provider: data.smsProvider,
      configured: data.smsConfigured,
    },
  ];

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
        Notification Status
      </p>
      <h2 className="mt-3 text-2xl font-bold text-black">Premium alert channels</h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {channels.map((channel) => (
          <div key={channel.name} className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-black">{channel.name}</p>
                <p className="mt-1 text-sm text-gray-500">{channel.provider}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${channel.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {channel.configured ? "Configured" : "Needs setup"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-gray-500">
        Delivery totals can be added once the notification log table fields are confirmed.
      </p>
    </section>
  );
}
