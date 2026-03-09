export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white/50 py-8">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} BoardLog
      </div>
    </footer>
  )
}
