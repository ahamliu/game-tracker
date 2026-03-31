import { auth } from "@/auth";
import { ExploreFiltersForm } from "@/components/explore/explore-filters-form";
import {
  ExploreLibraryCarousel,
  ExploreSignedOutCarousel,
} from "@/components/explore/explore-library-carousel";
import { ExplorePagination } from "@/components/explore/explore-pagination";
import { ExplorePopularGrid } from "@/components/explore/explore-popular-grid";
import { getCarouselForUser, getDistinctGenres, getExplorePopular, type ExploreSort } from "@/lib/explore";

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

  const [{ rows, total }, genreOptions, carousel] = await Promise.all([
    getExplorePopular({
      page,
      pageSize: PAGE_SIZE,
      q: q || undefined,
      genreIds,
      sort,
    }),
    getDistinctGenres(),
    session?.user?.id ? getCarouselForUser(session.user.id) : Promise.resolve(null),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const genresCsv = genreIds.length ? genreIds.join(",") : "";

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Explore</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Discover games &amp; track your library</h1>
        <p className="text-muted-foreground">
          Browse what the community is playing, then save titles to your shelf with routes and ratings.
        </p>
      </header>

      <ExploreFiltersForm
        initialQ={q}
        initialSort={sort}
        initialGenreIds={genreIds}
        genres={genreOptions}
      />

      <section className="space-y-3" aria-label="Your library">
        {session?.user?.id ? (
          <ExploreLibraryCarousel entries={carousel ?? []} />
        ) : (
          <ExploreSignedOutCarousel />
        )}
      </section>

      <section className="space-y-4" aria-labelledby="popular-heading">
        <h2 id="popular-heading" className="text-lg font-semibold tracking-tight">
          Popular on GameShelf
        </h2>
        <p className="text-sm text-muted-foreground">
          Ranked by how many members have added each game to their library.
        </p>
        <ExplorePopularGrid rows={rows} />
        <ExplorePagination
          page={page}
          totalPages={totalPages}
          q={q}
          sort={sort}
          genresCsv={genresCsv}
        />
      </section>
    </div>
  );
}
