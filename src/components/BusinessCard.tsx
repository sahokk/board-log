import Image from "next/image"
import { getDisplayName, getProfileImage, parseFavoriteGenres } from "@/lib/profile-utils"
import type { TitleWithUnlocked } from "@/lib/titles"
import type { BoardgameType } from "@/lib/boardgame-type"
import type { CardTheme } from "@/lib/card-themes"

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
}

interface Props {
  user: UserData
  stats: Stats
  featuredGames: Game[]
  boardgameType: BoardgameType
  theme: CardTheme
  titles: TitleWithUnlocked[]
}

const LEFT_W = 320
const CARD_W = 1000
const CARD_H = 560

export function BusinessCard({ user, stats, featuredGames, boardgameType, theme, titles }: Readonly<Props>) {
  const displayName = getDisplayName(user)
  const profileImage = getProfileImage(user)
  const genres = parseFavoriteGenres(user.favoriteGenres)
  const displayGames = featuredGames.slice(0, 3)
  const unlockedTitles = titles.filter((t) => t.unlocked).slice(0, 6)
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://board-log.pekori.dev").replace(/^https?:\/\//, "")
  const profileUrl = user.username ? `${baseUrl}/u/${user.username}` : baseUrl
  const rightW = CARD_W - LEFT_W

  return (
    <div
      style={{ width: CARD_W, height: CARD_H, fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}
      className="relative overflow-hidden rounded-3xl shadow-2xl"
    >
      {/* ── Main area ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left panel (dark) ── */}
        <div style={{
          width: LEFT_W, flexShrink: 0,
          background: theme.leftBg,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "32px 28px", position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{
            position: "absolute", width: 220, height: 220, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${theme.decorRgb},0.18) 0%, transparent 70%)`,
            top: -60, right: -60,
          }} />
          <div style={{
            position: "absolute", width: 160, height: 160, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${theme.decorRgb},0.10) 0%, transparent 70%)`,
            bottom: -40, left: -40,
          }} />
          <div style={{ position: "absolute", fontSize: 64, top: 12, right: 16, opacity: 0.1, userSelect: "none" }}>🎲</div>

          {/* Avatar */}
          <div style={{
            position: "relative", width: 76, height: 76, borderRadius: "50%", overflow: "hidden",
            boxShadow: `0 0 0 3px rgba(${theme.decorRgb},0.5), 0 6px 20px rgba(0,0,0,0.4)`,
          }}>
            {profileImage ? (
              <Image src={profileImage} alt={displayName} fill className="object-cover" sizes="76px" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, background: "rgba(255,255,255,0.1)" }}>
                👤
              </div>
            )}
          </div>

          {/* Name */}
          <p style={{ marginTop: 12, fontSize: 20, fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.2, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            {displayName}
          </p>

          {/* Genre tags */}
          {genres.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
              {genres.map((genre) => (
                <span key={genre} style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 9999,
                  background: "rgba(255,255,255,0.12)", color: theme.accentColor,
                  border: "1px solid rgba(255,255,255,0.18)",
                }}>
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ width: "100%", height: 1, background: `rgba(${theme.decorRgb},0.3)`, margin: "16px 0" }} />

          {/* Boardgame type */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.accentMuted, marginBottom: 6 }}>
              ボードゲームタイプ
            </p>
            <span style={{ fontSize: 40, lineHeight: 1, display: "block" }}>{boardgameType.icon}</span>
            <p style={{ marginTop: 6, fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{boardgameType.name}</p>
            <p style={{ marginTop: 4, fontSize: 11, color: theme.accentColor, opacity: 0.85 }}>{boardgameType.tagline}</p>
          </div>
        </div>

        {/* ── Right panel (cream) ── */}
        <div style={{
          width: rightW, background: "#faf7f0",
          display: "flex", flexDirection: "column",
          padding: "24px 28px 20px",
        }}>
          {/* Stats row */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            {[
              { value: stats.totalPlays, label: "総プレイ数" },
              { value: stats.uniqueGames, label: "ゲーム種類" },
              { value: unlockedTitles.length, label: "獲得称号" },
            ].map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <div style={{ width: 1, height: 28, background: "#fde68a", margin: "0 16px" }} />}
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color: "#451a03", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: "#92400e", marginTop: 2 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Featured games */}
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b45309", marginBottom: 10 }}>
            ★ お気に入りゲーム
          </p>
          {displayGames.length > 0 ? (
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {displayGames.map((game) => (
                <div key={game.id} style={{
                  flex: 1, borderRadius: 12, overflow: "hidden",
                  background: "#fff", boxShadow: "0 3px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ position: "relative", aspectRatio: "1", background: "#fdf6e3" }}>
                    {game.imageUrl ? (
                      <Image src={game.imageUrl} alt={game.name} fill className="object-contain" style={{ padding: 8 }} sizes="180px" />
                    ) : (
                      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🎲</div>
                    )}
                  </div>
                  <div style={{ padding: "6px 6px 8px" }}>
                    <p style={{
                      fontSize: 10, fontWeight: 600, color: "#451a03", lineHeight: 1.3, textAlign: "center",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>{game.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: "#b45309", opacity: 0.5 }}>（ゲームが選択されていません）</p>
            </div>
          )}

          {/* Titles */}
          {unlockedTitles.length > 0 && (
            <>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b45309", marginBottom: 8 }}>
                ★ 獲得称号
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {unlockedTitles.map((title) => (
                  <div key={title.id} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 9999,
                    background: "#451a03", color: "#fff",
                  }}>
                    <span style={{ fontSize: 12 }}>{title.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{title.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        height: 44, flexShrink: 0,
        background: theme.footerBg,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>🎲 BoardLog</p>
        <p style={{ fontSize: 10, color: theme.accentMuted }}>{profileUrl}</p>
      </div>
    </div>
  )
}
