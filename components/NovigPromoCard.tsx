export default function NovigPromoCard() {
  return (
    <aside
      className="mb-6 overflow-hidden rounded-xl border border-zinc-800 bg-[#050505]"
      aria-label="Novig promotional offer"
    >
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <img
              src="/partners/novig-logo-white.png"
              alt="Novig"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span className="text-base font-black tracking-tight text-white">
              NOVIG
            </span>
          </div>

          <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
            Deposit $10. Get $50 in Trade Credits.
          </h2>

          <p className="mt-1.5 max-w-2xl text-sm leading-5 text-zinc-300">
            New Novig members who deposit $10 or more receive{" "}
            <strong className="font-semibold text-white">
              $50 in Trade Credits.
            </strong>
          </p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Promo code
            </span>
            <span className="font-bold tracking-wide text-white">
              KOFSPORTS
            </span>
          </div>
        </div>

        <div className="lg:min-w-52">
          <a
            href="https://novig.onelink.me/JHQQ/sz3auvq5"
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="flex w-full items-center justify-center rounded-lg bg-[#179BE7] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Claim $50 in Trade Credits
          </a>

          <a
            href="https://support.novig.us/en/articles/16116457-new-member-deposit-program-terms-conditions"
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="mt-2 block text-center text-[11px] text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-white"
          >
            Offer terms &amp; conditions
          </a>
        </div>
      </div>

      <div className="border-t border-zinc-800 px-4 py-3 sm:px-5">
        <p className="text-[11px] leading-4 text-zinc-500">
          Sponsored • KofSports may earn a commission.
        </p>

        <p className="mt-2 text-[11px] leading-4 text-zinc-500">
          Restrictions &amp; requirements apply. Not available in all states.
          21+. Event contract trading involves risk &amp; is not appropriate
          for all. Consider if it&apos;s appropriate for you in light of
          financial circumstances. See{" "}
          <a
            href="https://novig.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-zinc-300"
          >
            novig.com/terms
          </a>{" "}
          for information.
        </p>
      </div>
    </aside>
  );
}
