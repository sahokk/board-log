import Image from "next/image"
import { getDisplayName, getProfileImage, parseFavoriteGenres } from "@/lib/profile-utils"
import type { TitleWithUnlocked } from "@/lib/titles"

interface Game {
  id: string
  name: string
  imageUrl: string | null
}

interface UserData {
  username?: string | null
  displayName?: string | null
  name?: string | null
  customImageUrl?: string | null
  image?: string | null
  favoriteGenres?: string | null
}

interface Stats {
  totalPlays: number
  uniqueGames: number
  averageRating?: string
  wishlistCount?: number
}

interface Props {
  user: UserData
  stats: Stats
  favoriteGames: Game[]
  titles: TitleWithUnlocked[]
}

export function BusinessCard({ user, stats, favoriteGames, titles }: Readonly<Props>) {
  const displayName = getDisplayName(user)
  const profileImage = getProfileImage(user)
  const genres = parseFavoriteGenres(user.favoriteGenres)

  const displayGames = favoriteGames.slice(0, 5)
  const unlockedTitles = titles.filter((t) => t.unlocked).slice(0, 6)
  const profileUrl = user.username ? `board-log.pekori.dev/u/${user.username}` : "board-log.pekori.dev"

  return (
    <div
      style={{ width: "800px", height: "1000px", fontFamily: "sans-serif" }}
      className="relative overflow-hidden rounded-3xl shadow-2xl"
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-[#faf7f0]" />

      {/* ── Header (dark panel) ── */}
      <div
        className="relative overflow-hidden"
        style={{
          height: "280px",
          background: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute rounded-full"
          style={{
            width: 320, height: 320,
            background: "radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%)",
            top: -80, right: -60,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 200, height: 200,
            background: "radial-gradient(circle, rgba(217,119,6,0.1) 0%, transparent 70%)",
            bottom: -40, left: -40,
          }}
        />
        {/* Dice icon */}
        <div
          className="absolute text-7xl select-none"
          style={{ top: 20, right: 32, opacity: 0.12 }}
        >
          🎲
        </div>
        <div
          className="absolute text-5xl select-none"
          style={{ bottom: 16, left: 28, opacity: 0.08 }}
        >
          ♟
        </div>

        {/* User content */}
        <div className="relative flex h-full flex-col items-center justify-center px-10 pt-4">
          {/* Avatar */}
          <div
            className="relative overflow-hidden rounded-full"
            style={{
              width: 88, height: 88,
              boxShadow: "0 0 0 3px rgba(217,119,6,0.5), 0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {profileImage ? (
              <Image src={profileImage} alt={displayName} fill className="object-cover" sizes="88px" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-4xl"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                👤
              </div>
            )}
          </div>

          {/* Name */}
          <h1
            className="mt-3 font-bold text-white tracking-tight"
            style={{ fontSize: 34, lineHeight: 1.1, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
          >
            {displayName}
          </h1>

          {/* Genre tags */}
          {genres.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full font-medium"
                  style={{
                    fontSize: 12,
                    padding: "3px 12px",
                    background: "rgba(255,255,255,0.15)",
                    color: "#fde68a",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div
        className="flex items-center justify-around"
        style={{
          height: 80,
          background: "#fffbf0",
          borderBottom: "1px solid #fde68a",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="text-center">
          <p style={{ fontSize: 32, fontWeight: 800, color: "#451a03", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {stats.totalPlays}
          </p>
          <p style={{ fontSize: 11, color: "#92400e", marginTop: 3 }}>総プレイ数</p>
        </div>
        <div style={{ width: 1, height: 36, background: "#fde68a" }} />
        <div className="text-center">
          <p style={{ fontSize: 32, fontWeight: 800, color: "#451a03", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {stats.uniqueGames}
          </p>
          <p style={{ fontSize: 11, color: "#92400e", marginTop: 3 }}>ゲーム種類</p>
        </div>
        <div style={{ width: 1, height: 36, background: "#fde68a" }} />
        <div className="text-center">
          <p style={{ fontSize: 32, fontWeight: 800, color: "#451a03", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {unlockedTitles.length}
          </p>
          <p style={{ fontSize: 11, color: "#92400e", marginTop: 3 }}>獲得称号</p>
        </div>
      </div>

      {/* ── Favorite Games ── */}
      <div style={{ padding: "24px 40px 20px" }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#b45309",
            marginBottom: 12,
          }}
        >
          ★ お気に入りゲーム
        </p>
        {displayGames.length > 0 ? (
          <div style={{ display: "flex", gap: 12 }}>
            {displayGames.map((game) => (
              <div
                key={game.id}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ position: "relative", aspectRatio: "1", background: "#fdf6e3" }}>
                  {game.imageUrl ? (
                    <Image
                      src={game.imageUrl}
                      alt={game.name}
                      fill
                      className="object-contain"
                      style={{ padding: 8 }}
                      sizes="130px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🎲</div>
                  )}
                </div>
                <div style={{ padding: "6px 6px 8px" }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#451a03",
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textAlign: "center",
                    }}
                  >
                    {game.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "#b45309", opacity: 0.5 }}>（まだ評価5のゲームがありません）</p>
        )}
      </div>

      {/* Divider */}
      <div style={{ margin: "0 40px", height: 1, background: "#fde68a" }} />

      {/* ── Titles ── */}
      {unlockedTitles.length > 0 && (
        <div style={{ padding: "20px 40px" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#b45309",
              marginBottom: 12,
            }}
          >
            ★ 獲得称号
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {unlockedTitles.map((title) => (
              <div
                key={title.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 9999,
                  background: "#451a03",
                  color: "#fff",
                }}
              >
                <span style={{ fontSize: 14 }}>{title.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{title.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between"
        style={{
          height: 56,
          padding: "0 40px",
          background: "linear-gradient(135deg, #451a03 0%, #78350f 100%)",
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>🎲 BoardLog</p>
        <p style={{ fontSize: 11, color: "rgba(253,230,138,0.7)" }}>{profileUrl}</p>
      </div>
    </div>
  )
}
