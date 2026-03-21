import { translateMechanic, getMechanicDesc } from "@/lib/bgg/translations"

interface Props {
  name: string // BGG英語名
  /** default: pill付き / outline: 枠線pill / bare: テキストのみ（親のpillに埋め込む用） */
  variant?: "default" | "outline" | "bare"
}

const TOOLTIP_CLASS =
  "pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-xl bg-amber-950 px-3 py-2 text-xs leading-relaxed text-amber-50 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"

const PILL_CLASS: Record<string, string> = {
  default: "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
  outline: "rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700",
}

export function MechanicTag({ name, variant = "default" }: Readonly<Props>) {
  const label = translateMechanic(name)
  if (!label) return null
  const desc = getMechanicDesc(name)

  // bare: テキスト＋ツールチップのみ、pill スタイルなし（親要素に埋め込む用）
  if (variant === "bare") {
    if (!desc) return <span>{label}</span>
    return (
      <span className="group relative inline-block">
        <span className="cursor-help underline decoration-dotted decoration-current underline-offset-2 opacity-90">
          {label}
        </span>
        <span role="tooltip" className={TOOLTIP_CLASS}>
          {desc}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-950" />
        </span>
      </span>
    )
  }

  const pillClass = PILL_CLASS[variant]

  if (!desc) {
    return <span className={pillClass}>{label}</span>
  }

  return (
    <span className="group relative inline-block">
      <span className={`${pillClass} cursor-help underline decoration-dotted decoration-amber-400 underline-offset-2`}>
        {label}
      </span>
      <span role="tooltip" className={TOOLTIP_CLASS}>
        {desc}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-950" />
      </span>
    </span>
  )
}
