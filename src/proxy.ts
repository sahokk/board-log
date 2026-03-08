import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Next.js 16では proxy.ts がミドルウェアとして機能する。
// Prismaアダプター（DB sessions）はEdge Runtimeで動作しないため、
// Cookieの存在確認のみ行う。実際のセッション検証はServer Components内でauth()が担う。
const protectedPaths = ["/plays", "/record"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  if (!sessionToken) {
    const signInUrl = new URL("/api/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/plays/:path*", "/record/:path*"],
}
