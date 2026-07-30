import type { GrowthLead } from "@/lib/growth/lead";

type LeadProfileCardProps = {
  lead: GrowthLead;
};

function formatLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function LeadProfileCard({
  lead,
}: LeadProfileCardProps) {
  const details = [
    ["Platform", formatLabel(lead.platform)],
    ["Status", formatLabel(lead.status)],
    ["Source", formatLabel(lead.source)],
    ["Location", lead.location || "Not set"],
    ["Last Contact", formatDate(lead.lastContactAt)],
    ["Created", formatDate(lead.createdAt)],
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-black text-slate-950">
          Lead Profile
        </h2>
      </div>

      <div className="space-y-5 p-5">
        <dl className="space-y-4">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4"
            >
              <dt className="text-sm font-semibold text-slate-500">
                {label}
              </dt>
              <dd className="text-right text-sm font-bold text-slate-900">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="text-sm font-semibold text-slate-500">
            Favorite Sports
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {lead.favoriteSports.length > 0 ? (
              lead.favoriteSports.map((sport) => (
                <span
                  key={sport}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                >
                  {sport.toUpperCase()}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">
                None added
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">
            Notes
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {lead.notes || "No notes have been added yet."}
          </p>
        </div>

        {lead.profileUrl ? (
          <a
            href={lead.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-600"
          >
            Open social profile ↗
          </a>
        ) : null}
      </div>
    </section>
  );
}
