import type { ReactNode } from "react"

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function SectionHeader({ title, subtitle, action }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-amber-950">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-amber-800/70">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
