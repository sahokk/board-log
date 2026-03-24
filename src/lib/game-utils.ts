/**
 * ゲーム表示名を返す。優先順位: customNameJa > nameJa > name
 */
export function getGameName(game: {
  name: string
  nameJa?: string | null
  customNameJa?: string | null
}): string {
  return game.customNameJa ?? game.nameJa ?? game.name
}
