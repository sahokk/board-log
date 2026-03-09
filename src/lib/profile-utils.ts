interface UserProfile {
  displayName?: string | null
  name?: string | null
  customImageUrl?: string | null
  image?: string | null
  favoriteGenres?: string | null
}

export function getDisplayName(user: UserProfile): string {
  return user.displayName || user.name || "ゲストユーザー"
}

export function getProfileImage(user: UserProfile): string | null {
  return user.customImageUrl || user.image || null
}

export function parseFavoriteGenres(favoriteGenres?: string | null): string[] {
  if (!favoriteGenres) return []
  return favoriteGenres
    .split(",")
    .map((g) => g.trim())
    .filter((g) => g.length > 0)
}

export function formatFavoriteGenres(genres: string[]): string {
  return genres.filter((g) => g.trim()).join(", ")
}
