import Link from "next/link";
import { premiumPlans, proPlans } from "@/lib/marketing/plans";
export function PlanComparison() {
  const plans = [...premiumPlans, ...proPlans];
  const features = [
    {
      label: "Official picks + written analysis",
      value: (i: number) => (i < 4 ? "Included" : "Not included"),
    },
    { label: "Pro research tools", value: () => "Included" },
    {
      label: "Access / billing period",
      value: (i: number) => plans[i].duration,
    },
    { label: "Renewal", value: (i: number) => plans[i].billingLabel },
    { label: "Price per charge", value: (i: number) => plans[i].price },
  ];
  return (
    <section aria-labelledby="compare-plans" className="mb-16">
      <h2
        id="compare-plans"
        className="font-display text-3xl font-bold uppercase text-white"
      >
        Picks, tools, or both?
      </h2>
      <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
        Start with what you want. Premium includes the picks and Pro; the four
        passes change your access period. Pro Monthly and Annual have the same
        tools, with different billing periods.
      </p>
      <nav
        aria-label="Choose your access"
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <Link
          href="#premium-plans"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-brand px-6 py-3 font-bold text-black"
        >
          I want Kof’s picks + Pro
        </Link>
        <Link
          href="#pro-plans"
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/20 px-6 py-3 font-bold text-white"
        >
          I want research tools only
        </Link>
      </nav>
      <div
        className="mt-8 overflow-x-auto rounded-xl border border-white/10"
        role="region"
        aria-label="Compare all six plans; scroll horizontally on a phone"
        tabIndex={0}
      >
        <table className="w-full min-w-[1000px] text-left text-sm">
          <caption className="px-4 py-4 text-left text-zinc-400">
            Compare all six plans. On a phone, scroll this table sideways; the
            plan cards below stack vertically.
          </caption>
          <thead className="bg-zinc-900">
            <tr>
              <th scope="col" className="p-4">
                What you get
              </th>
              {plans.map((p) => (
                <th key={p.planKey} scope="col" className="p-4 text-white">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.label} className="border-t border-white/10">
                <th scope="row" className="p-4 text-zinc-200">
                  {f.label}
                </th>
                {plans.map((p, i) => (
                  <td key={p.planKey} className="p-4 text-zinc-400">
                    {f.value(i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-5 text-sm leading-7 text-zinc-400">
        Research-only starts at $9.99/month. Premium already includes Pro: do
        not buy both. The one-day pass costs $10 once; recurring charges are
        labeled on every other plan.{" "}
        <Link href="/vs" className="text-brand underline">
          Compare KofSports with other tools
        </Link>
        .
      </p>
    </section>
  );
}
