import { auth } from "@/auth";
import { ExploreFiltersForm } from "@/components/explore/explore-filters-form";
import { ExploreLibraryCarousel } from "@/components/explore/explore-library-carousel";
import { ExploreHomeSidebar } from "@/components/explore/explore-home-sidebar";
import { ExplorePlayingCarousel } from "@/components/explore/explore-playing-carousel";
import {
  SignedOutPlaying,
  SignedOutLibrary,
  SignedOutSidebar,
} from "@/components/explore/explore-signed-out-home";
import { ExplorePagination } from "@/components/explore/explore-pagination";
import { ExplorePopularGrid } from "@/components/explore/explore-popular-grid";
import { ExploreRecentlyAdded } from "@/components/explore/explore-recently-added";
import {
  getCarouselForUser,
  getDistinctGenres,
  getExplorePopular,
  getFriendUpdates,
  getPlayingForUser,
  getRecentlyAdded,
  getStatsForUser,
  getUserLibraryGameIds,
  type ExploreSort,
} from "@/lib/explore";

const PAGE_SIZE = 24;

function parseGenreIds(genres: string | string[] | undefined): number[] {
  if (!genres) return [];
  const s = Array.isArray(genres) ? genres.join(",") : genres;
  return s
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

function parseSort(s: string | string[] | undefined): ExploreSort {
  const v = Array.isArray(s) ? s[0] : s;
  if (v === "rated" || v === "newest" || v === "popular") return v;
  return "popular";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const q = String(Array.isArray(sp.q) ? sp.q[0] ?? "" : sp.q ?? "");
  const sort = parseSort(sp.sort);
  const genreIds = parseGenreIds(sp.genres);

  const session = await auth();

  const [{ rows, total }, genreOptions, carousel, playing, recentlyAdded, libraryGameIds, statsData, friendUpdates] = await Promise.all([
    getExplorePopular({ page, pageSize: PAGE_SIZE, q: q || undefined, genreIds, sort }),
    getDistinctGenres(),
    session?.user?.id ? getCarouselForUser(session.user.id) : Promise.resolve(null),
    session?.user?.id ? getPlayingForUser(session.user.id) : Promise.resolve([]),
    getRecentlyAdded(4),
    session?.user?.id ? getUserLibraryGameIds(session.user.id) : Promise.resolve([]),
    session?.user?.id ? getStatsForUser(session.user.id) : Promise.resolve(null),
    session?.user?.id ? getFriendUpdates(session.user.id, 4) : Promise.resolve([]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const genresCsv = genreIds.length ? genreIds.join(",") : "";

  return (
    <div className="mx-auto max-w-[1380px] space-y-8 py-2">
      {/* Currently Playing + Sidebar */}
      {session?.user?.id && (
        <section className="grid gap-6 lg:grid-cols-[1fr_330px]">
          <div className="min-w-0 space-y-8">
            {playing.length > 0 && (
              <ExplorePlayingCarousel entries={playing} />
            )}
            <ExploreLibraryCarousel entries={carousel ?? []} />
          </div>
          <div className="hidden space-y-5 lg:block">
            {statsData && <ExploreHomeSidebar stats={statsData} friendUpdates={friendUpdates} />}
            <div className="border-t border-border pt-5">
              <ExploreRecentlyAdded entries={recentlyAdded} />
            </div>
          </div>
        </section>
      )}

      {/* Signed-out state */}
      {!session?.user?.id && (
        <section className="grid gap-6 lg:grid-cols-[1fr_330px]">
          <div className="min-w-0 space-y-8">
            <SignedOutPlaying sampleGame={rows[0] ? {
              id: rows[0].game.id,
              title: rows[0].game.title,
              coverUrl: rows[0].game.coverUrl,
              developerName: rows[0].game.developerName,
              notes: "my gamenotes here :)",
              routes: [
                { name: "Dawntrail", imageUrl: "https://lds-img.finalfantasyxiv.com/promo/h/P/vlB4zV5DeQaEK3K8BN2Qr975YU.png" },
                { name: "Endwalker", imageUrl: "https://lds-img.finalfantasyxiv.com/promo/h/M/xRfPaGRwUih5gCM0FcNvQJSevw.png", cleared: true },
                { name: "Shadowbringers", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQk5CdWScx01eAVTOlaQSr4OLTYQCyVQzAq5A&s", cleared: true },
                { name: "Stormblood", imageUrl: null },
                { name: "Heavensward", imageUrl: null },
              ],
            } : undefined} />
            <SignedOutLibrary sampleGame={rows[1] ? { id: rows[1].game.id, title: rows[1].game.title, coverUrl: rows[1].game.coverUrl, developerName: rows[1].game.developerName } : undefined} />
          </div>
          <div className="hidden space-y-5 lg:block">
            <SignedOutSidebar />
            <div className="border-t border-border pt-5">
              <ExploreRecentlyAdded entries={recentlyAdded} />
            </div>
          </div>
        </section>
      )}

      {/* Popular games */}
      <section>
        <h2 className="mb-3 font-display text-[20px] font-normal tracking-[0.05rem] text-app-muted">Popular Games</h2>
        <ExploreFiltersForm
          initialQ={q}
          initialSort={sort}
          initialGenreIds={genreIds}
          genres={genreOptions}
          total={total}
        />
        <div className="mt-3">
          <ExplorePopularGrid rows={rows} libraryGameIds={libraryGameIds} signedIn={!!session?.user} />
        </div>
        <ExplorePagination
          page={page}
          totalPages={totalPages}
          q={q}
          sort={sort}
          genresCsv={genresCsv}
        />
      </section>

      {/* Recently Added on mobile (below popular) */}
      <section className="lg:hidden">
        <ExploreRecentlyAdded entries={recentlyAdded} />
      </section>
    </div>
  );
}
