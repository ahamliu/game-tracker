import Image from "next/image";
import Link from "next/link";
import { CaretLeft, CaretRight, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export type SampleRoute = {
  name: string;
  imageUrl: string | null;
  cleared?: boolean;
};

export type SampleGame = {
  id: string;
  title: string;
  coverUrl: string | null;
  developerName: string | null;
  notes?: string;
  routes?: SampleRoute[];
};

function RealPlayingCard({ game }: { game: SampleGame }) {
  const routes = game.routes ?? [];
  return (
    <div className="shrink-0" style={{ width: "calc((100% - 2 * 0.75rem) / 2.3)" }}>
      <Link href={`/games/${game.id}`}>
        <article className="flex h-full gap-3 rounded-[10px] bg-card p-3 transition-all hover:shadow-[0_1px_1px_0_rgba(0,0,0,0.25)]">
          <div className="relative h-28 w-[78px] shrink-0 overflow-hidden rounded-lg bg-muted">
            {game.coverUrl ? (
              <Image src={game.coverUrl} alt="" fill className="object-cover" sizes="78px" />
            ) : (
              <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">--</div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="text-[16px] font-semibold leading-snug text-[#646373] line-clamp-2">{game.title}</h3>
            {game.notes && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{game.notes}</p>
            )}
            {routes.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1 pt-1.5">
                {routes.slice(0, 3).map((r) => (
                  <div key={r.name} className="group/route relative">
                    <div
                      className={cn(
                        "relative h-[32px] w-[32px] overflow-hidden rounded-full border-2 bg-muted",
                        r.cleared ? "border-success" : "border-[#646373] grayscale",
                      )}
                    >
                      {r.imageUrl ? (
                        <Image src={r.imageUrl} alt="" fill unoptimized className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[8px] font-medium text-muted-foreground">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {r.cleared && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white">
                        <SealCheck size={14} weight="fill" className="text-success" />
                      </span>
                    )}
                    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#333] px-2 py-0.5 text-[10px] text-white opacity-0 shadow transition-opacity group-hover/route:opacity-100 dark:bg-[#e5e5e5] dark:text-[#1a1a1a]">
                      {r.name}
                    </span>
                  </div>
                ))}
                {routes.length > 3 && (
                  <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground">
                    +{routes.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </article>
      </Link>
    </div>
  );
}

function GhostPlayingCard() {
  return (
    <div className="shrink-0 opacity-60" style={{ width: "calc((100% - 2 * 0.75rem) / 2.3)" }}>
      <article className="flex h-full gap-3 rounded-[10px] bg-card p-3">
        <div className="h-28 w-[78px] shrink-0 rounded-lg bg-[#e8e8ec] dark:bg-[#252530]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
          <div className="h-3 w-3/4 rounded bg-[#e8e8ec] dark:bg-[#252530]" />
          <div className="h-2.5 w-1/2 rounded bg-[#e8e8ec] dark:bg-[#252530]" />
          <div className="mt-auto flex gap-1.5">
            <div className="h-[32px] w-[32px] rounded-full bg-[#e8e8ec] dark:bg-[#252530]" />
            <div className="h-[32px] w-[32px] rounded-full bg-[#e8e8ec] dark:bg-[#252530]" />
          </div>
        </div>
      </article>
    </div>
  );
}

function RealLibraryCard({ game }: { game: SampleGame }) {
  return (
    <div className="shrink-0" style={{ width: "calc((100% - 4 * 1rem) / 5)" }}>
      <Link href={`/games/${game.id}`}>
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[10px] bg-muted">
          {game.coverUrl ? (
            <Image src={game.coverUrl} alt="" fill className="object-cover" sizes="140px" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No cover</div>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-center text-[14px] font-semibold leading-tight text-[#646373]">{game.title}</p>
      </Link>
    </div>
  );
}

function GhostLibraryCard() {
  return (
    <div className="shrink-0 opacity-60" style={{ width: "calc((100% - 4 * 1rem) / 5)" }}>
      <div className="aspect-[2/3] w-full rounded-[10px] bg-card" />
      <div className="mx-auto mt-2 h-2.5 w-3/4 rounded bg-[#e8e8ec] dark:bg-[#252530]" />
      <div className="mx-auto mt-1.5 h-2.5 w-1/2 rounded bg-[#e8e8ec] dark:bg-[#252530]" />
    </div>
  );
}

export function SignedOutPlaying({ sampleGame }: { sampleGame?: SampleGame }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-[16px] font-bold text-[#646373]">Currently Playing</h2>
        <span className="text-[12px] text-muted-foreground">Your active games will appear here</span>
      </div>
      <div className="relative">
        <div className="flex gap-3 overflow-hidden">
          {sampleGame ? <RealPlayingCard game={sampleGame} /> : <GhostPlayingCard />}
          <GhostPlayingCard />
          <GhostPlayingCard />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute h-[160px] w-[400px] [background:radial-gradient(ellipse_at_center,rgba(255,255,255,0.75)_20%,rgba(255,255,255,0.5)_45%,transparent_75%)] dark:[background:radial-gradient(ellipse_at_center,rgba(24,24,27,0.75)_20%,rgba(24,24,27,0.5)_45%,transparent_75%)]" />
          <div className="relative flex gap-2">
            <Link
              href="/login"
              className="rounded-lg bg-[#656379] px-5 py-2 font-mono text-[12px] font-semibold uppercase text-white shadow-md hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-border bg-white px-5 py-2 font-mono text-[12px] font-semibold uppercase text-[#646373] shadow-md hover:bg-muted dark:bg-card"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignedOutLibrary({ sampleGame }: { sampleGame?: SampleGame }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-bold text-[#646373]">My Library</h2>
          <span className="text-[12px] text-muted-foreground">Your collection will appear here</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/30">
            <CaretLeft size={14} weight="bold" />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/30">
            <CaretRight size={14} weight="bold" />
          </span>
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden">
        {sampleGame ? <RealLibraryCard game={sampleGame} /> : <GhostLibraryCard />}
        {Array.from({ length: 4 }).map((_, i) => (
          <GhostLibraryCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SignedOutSidebar() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-bold text-[#646373]">My Statistics</h2>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Your stats will appear here
        </p>
      </div>

      <div className="border-t border-border pt-5">
        <h2 className="text-[16px] font-bold text-[#646373]">Friend Updates</h2>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Your friend activity will appear here
        </p>
      </div>
    </div>
  );
}
