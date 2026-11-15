import Link from "next/link";
import { marketingFaq } from "@/lib/marketing/faq";
import { JsonLd } from "./JsonLd";
export function MarketingFaq() {
  return (
    <section
      id="questions"
      aria-labelledby="questions-title"
      className="mx-auto max-w-4xl scroll-mt-24 px-5 py-16"
    >
      <h2
        id="questions-title"
        className="font-display text-3xl font-bold uppercase text-white"
      >
        Before you choose
      </h2>
      <div className="mt-6 divide-y divide-white/10">
        {marketingFaq.map((item) => (
          <details key={item.question} className="py-5">
            <summary className="min-h-11 cursor-pointer font-semibold text-zinc-200">
              {item.question}
            </summary>
            <p className="mt-3 leading-7 text-zinc-400">{item.answer}</p>
          </details>
        ))}
      </div>
      <p className="mt-4 text-sm text-zinc-400">
        <Link
          href="/results#record-methodology"
          className="text-brand underline"
        >
          Read the grading methodology
        </Link>{" "}
        or{" "}
        <a href="mailto:kof@kofsports.com" className="text-brand underline">
          ask Kof a question
        </a>
        .
      </p>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: marketingFaq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
    </section>
  );
}
