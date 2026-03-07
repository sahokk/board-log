import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900">BoardLog</h1>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-zinc-500">{user.email}</span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    ログアウト
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  新規登録
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-zinc-900">
          ボードゲームの
          <br />
          思い出アルバム
        </h2>
        <p className="max-w-sm text-base text-zinc-500">
          プレイした記録を残して、あの日の熱戦を振り返ろう。
        </p>

        {user ? (
          <Link
            href="/plays"
            className="mt-4 rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-700"
          >
            プレイ履歴を見る
          </Link>
        ) : (
          <Link
            href="/signup"
            className="mt-4 rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-700"
          >
            はじめる
          </Link>
        )}
      </main>
    </div>
  );
}
