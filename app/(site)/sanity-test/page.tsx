import Image from "next/image";

import { getArticles } from "@/sanity/lib/articles";
import { urlForImage } from "@/sanity/lib/image";

export const metadata = {
  title: "Sanity Connection Test",
};

export default async function SanityTestPage() {
  const articles = await getArticles();

  return (
    <section className="mx-auto min-h-screen max-w-5xl px-5 py-20 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand">
        Development Test
      </p>

      <h1 className="mt-3 font-display text-4xl font-bold uppercase text-white">
        Sanity Articles
      </h1>

      <p className="mt-4 text-zinc-400">
        Published articles found: {articles.length}
      </p>

      {articles.length === 0 ? (
        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-8">
          <p className="text-zinc-300">
            No published articles were returned from Sanity.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {articles.map((article) => {
            const imageUrl = article.featuredImage
              ? urlForImage(article.featuredImage)
                  .width(1000)
                  .height(563)
                  .url()
              : null;

            return (
              <article
                key={article._id}
                className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950"
              >
                {imageUrl && (
                  <div className="relative aspect-video">
                    <Image
                      src={imageUrl}
                      alt={
                        article.featuredImage?.alt ??
                        article.title
                      }
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                    {article.sport}
                  </p>

                  <h2 className="mt-3 font-display text-2xl font-bold uppercase text-white">
                    {article.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {article.excerpt}
                  </p>

                  <p className="mt-5 text-xs text-zinc-500">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(article.publishedAt))}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}