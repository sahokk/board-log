import Image from "next/image"

interface Props {
  src: string | null | undefined
  alt: string
  sizes?: string
  className?: string
  fallbackClassName?: string
}

/**
 * ゲーム画像コンポーネント。src が null/undefined の場合は 🎲 アイコンを表示する。
 * 親要素は `position: relative` かつ高さが必要（Next.js Image の fill モード）。
 */
export function GameImage({
  src,
  alt,
  sizes = "200px",
  className = "object-contain p-3",
  fallbackClassName = "flex h-full items-center justify-center text-4xl text-amber-300",
}: Readonly<Props>) {
  if (src) {
    return <Image src={src} alt={alt} fill className={className} sizes={sizes} />
  }
  return (
    <div className={fallbackClassName}>
      🎲
    </div>
  )
}
