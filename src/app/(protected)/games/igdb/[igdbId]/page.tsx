import { notFound, redirect } from "next/navigation";
import { findOrCreateGameFromIgdb } from "@/lib/catalog";

type PageProps = { params: Promise<{ igdbId: string }> };

export default async function IgdbGameRedirect({ params }: PageProps) {
  const { igdbId: raw } = await params;
  const igdbId = Number(raw);
  if (!igdbId || Number.isNaN(igdbId)) notFound();

  const game = await findOrCreateGameFromIgdb(igdbId);
  if (!game) notFound();

  redirect(`/games/${game.id}`);
}
