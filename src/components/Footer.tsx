import { BggAttribution } from "@/components/BggAttribution"

export function Footer() {
  return (
    <footer className="border-t border-amber-200/50 bg-amber-50/30 py-8">
      <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-4">
        <span className="text-sm text-amber-700/60">
          &copy; {new Date().getFullYear()} BoardLog
        </span>
        <BggAttribution />
      </div>
    </footer>
  )
}
