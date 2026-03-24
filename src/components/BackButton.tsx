"use client"

import { useRouter } from "next/navigation"

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="mb-8 inline-flex items-center text-sm font-medium text-amber-800 transition-colors hover:text-amber-950"
    >
      ← 戻る
    </button>
  )
}
