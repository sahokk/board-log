import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WishlistButton } from "@/components/WishlistButton"
import ReportNameButton from "@/components/ReportNameButton"
import AdminGameNameEditor from "@/components/AdminGameNameEditor"
import BackButton from "@/components/BackButton"
import { isAdminUser } from "@/lib/admin"
import type { Metadata } from "next"
import BggMetadata from "@/components/BggMetadata"

interface Props {
  readonly params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const game = await prisma.game.findUnique({
    where: { id },
    select: { name: true, nameJa: true, customNameJa: true },
  })
  if (!game) return { title: "ゲームが見つかりません" }
  return { title: (game.customNameJa ?? game.nameJa ?? game.name) + " | Boardory" }
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params
  const game = await prisma.game.findUnique({ where: { id } })
  if (!game) notFound()

  const session = await auth()
  const [wishlisted, admin, pendingReports] = await Promise.all([
    session?.user?.id
      ? prisma.wishlistItem.findUnique({
          where: { userId_gameId: { userId: session.user.id, gameId: id } },
        }).then((r) => r !== null)
      : Promise.resolve(false),
    session?.user?.id ? isAdminUser(session.user.id) : Promise.resolve(false),
    prisma.nameReport.count({ where: { gameId: id, status: "PENDING" } }),
  ])

  return (
    <div className="wood-texture min-h-screen py-12">
      <div className="mx-auto max-w-lg px-6">
        <BackButton />

        {/* ゲーム箱画像 */}
        <div className="wood-card relative mx-auto mb-8 h-48 w-48 sm:h-64 sm:w-64 overflow-hidden rounded-2xl shadow-lg">
          <div className="relative h-full bg-linear-to-br from-amber-50/30 to-amber-100/30">
            {game.imageUrl ? (
              <Image
                src={game.imageUrl}
                alt={game.customNameJa ?? game.nameJa ?? game.name}
                fill
                className="object-contain p-6"
                sizes="(max-width: 640px) 192px, 256px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-amber-300">
                <span className="text-7xl">🎲</span>
              </div>
            )}
          </div>
        </div>

        {/* ゲーム名 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-amber-950">
            {game.customNameJa ?? game.nameJa ?? game.name}
          </h1>
          {(game.customNameJa || game.nameJa) && (
            <p className="mt-1 text-sm text-amber-800/60">{game.name}</p>
          )}
          {session?.user?.id && (
            <div className="mt-2 flex flex-col items-center gap-1">
              {admin ? (
                <AdminGameNameEditor
                  gameId={game.id}
                  currentCustomName={game.customNameJa}
                  pendingReportCount={pendingReports}
                />
              ) : (
                <ReportNameButton gameId={game.id} currentNameJa={game.customNameJa ?? game.nameJa} />
              )}
            </div>
          )}
        </div>

        {/* BGG メタデータ */}
        {(game.bggId || game.categories || game.mechanics || game.weight || game.playingTime) && (
          <BggMetadata game={game} />
        )}

        {/* アクション */}
        {session?.user?.id && (
          <div className="mb-6 flex flex-col gap-3">
            <Link
              href={`/record?gameId=${game.id}`}
              className="block w-full rounded-xl bg-amber-900 py-3 text-center text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md"
            >
              遊んだ！
            </Link>
            <WishlistButton gameId={game.id} initialWishlisted={wishlisted} />
          </div>
        )}
      </div>
    </div>
  )
}
