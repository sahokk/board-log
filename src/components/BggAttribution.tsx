export function BggAttribution() {
  return (
    <a
      href="https://boardgamegeek.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-2 transition-colors hover:bg-amber-100/50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bgg-logo.webp"
        alt="BoardGameGeek"
        width={24}
        height={24}
        className="rounded"
      />
      <span className="text-xs font-medium text-amber-800">
        Powered by BoardGameGeek
      </span>
    </a>
  )
}
