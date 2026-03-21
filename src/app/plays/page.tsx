import {redirect} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {auth} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
}

function StarDisplay({rating}: {readonly rating: number}) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => (
				<span
					key={star}
					className={
						star <= rating ? "text-amber-500" : "text-amber-200/40"
					}>
					★
				</span>
			))}
		</div>
	);
}

export default async function PlaysPage() {
	const session = await auth();
	if (!session?.user?.id) {
		redirect("/api/auth/signin?callbackUrl=/plays");
	}

	const entries = await prisma.gameEntry.findMany({
		where: {userId: session.user.id},
		include: {
			game: true,
			sessions: {orderBy: {playedAt: "desc"}, take: 1},
		},
		orderBy: {updatedAt: "desc"},
	});

	return (
		<div className="wood-texture min-h-screen py-12">
			<div className="mx-auto max-w-6xl px-6">
				{/* ヘッダー */}
				<div className="mb-10 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-amber-950">
							プレイ履歴
						</h1>
						<p className="mt-1 text-sm text-amber-800/70">
							あなたのボードゲームの思い出
						</p>
					</div>
					<Link
						href="/"
						className="rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md">
						+ 記録する
					</Link>
				</div>

				{entries.length === 0 ? (
					<div className="wood-card rounded-2xl p-16 text-center shadow-sm">
						<div className="mx-auto max-w-sm">
							<div className="mb-4 text-5xl">🎲</div>
							<p className="mb-2 text-lg font-medium text-amber-900">
								まだプレイ記録がありません
							</p>
							<p className="mb-8 text-sm text-amber-800/70">
								ゲームを検索してプレイを記録してみましょう
							</p>
							<Link
								href="/"
								className="inline-block rounded-xl bg-amber-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 hover:shadow-md">
								ゲームを探す
							</Link>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{entries.map((entry) => {
							const latestSession = entry.sessions[0];
							return (
								<Link
									key={entry.id}
									href={`/plays/${entry.id}`}
									className="wood-card group flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
									{/* 箱画像 */}
									<div className="relative aspect-square bg-linear-to-br from-amber-50/30 to-amber-100/30">
										{entry.game.imageUrl ? (
											<Image
												src={entry.game.imageUrl}
												alt={entry.game.name}
												fill
												className="object-contain p-3"
												sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
											/>
										) : (
											<div className="flex h-full items-center justify-center text-amber-300">
												<span className="text-4xl">
													🎲
												</span>
											</div>
										)}
									</div>

									{/* 情報 */}
									<div className="p-4">
										<p className="mb-2 line-clamp-2 text-sm font-semibold text-amber-950 group-hover:text-amber-800">
											{entry.game.nameJa ??
												entry.game.name}
										</p>
										<StarDisplay rating={entry.rating} />
										{latestSession?.playedAt && (
											<p className="mt-2 text-xs font-medium text-amber-700/60">
												{formatDate(latestSession.playedAt)}
											</p>
										)}
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
