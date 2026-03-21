import { redirect } from "next/navigation"

interface Props {
  readonly params: Promise<{ id: string }>
}

export default async function EditPlayPage({ params }: Props) {
  const { id } = await params
  redirect(`/plays/${id}`)
}
