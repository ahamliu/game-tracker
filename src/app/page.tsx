import { auth } from "@/auth";
import { ExploreFiltersForm } from "@/components/explore/explore-filters-form";
import {
  ExploreLibraryCarousel,
  ExploreSignedOutCarousel,
} from "@/components/explore/explore-library-carousel";
import { ExplorePagination } from "@/components/explore/explore-pagination";
import { ExplorePopularGrid } from "@/components/explore/explore-popular-grid";
import { ExploreRecentlyAdded } from "@/components/explore/explore-recently-added";
import {
  getCarouselForUser,
  getDistinctGenres,
  getExplorePopular,
  getRecentlyAdded,
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

  const [{ rows, total }, genreOptions, carousel, recentlyAdded] = await Promise.all([
    getExplorePopular({ page, pageSize: PAGE_SIZE, q: q || undefined, genreIds, sort }),
    getDistinctGenres(),
    session?.user?.id ? getCarouselForUser(session.user.id) : Promise.resolve(null),
    getRecentlyAdded(12),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const genresCsv = genreIds.length ? genreIds.join(",") : "";

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 py-2">
      {/* Search and filters */}
      <section>
        <ExploreFiltersForm
          initialQ={q}
          initialSort={sort}
          initialGenreIds={genreIds}
          genres={genreOptions}
        />
      </section>

      {/* Library + Recently Added side by side */}
      <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {session?.user?.id ? (
            <ExploreLibraryCarousel entries={carousel ?? []} />
          ) : (
            <ExploreSignedOutCarousel />
          )}
        </div>
        <div className="hidden lg:block">
          <ExploreRecentlyAdded entries={recentlyAdded} />
        </div>
      </section>

      {/* Popular games */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#646373]">Popular Games</h2>
          <span className="text-[12px] text-muted-foreground">
            {total.toLocaleString()} {total === 1 ? "game" : "games"}
          </span>
        </div>
        <ExplorePopularGrid rows={rows} />
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
