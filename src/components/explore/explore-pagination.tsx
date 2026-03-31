import Link from "next/link";

export function ExplorePagination({
  page,
  totalPages,
  q,
  sort,
  genresCsv,
}: {
  page: number;
  totalPages: number;
  q: string;
  sort: string;
  genresCsv: string;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (sort && sort !== "popular") params.set("sort", sort);
    if (genresCsv.trim()) params.set("genres", genresCsv.trim());
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/?${s}` : "/";
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 pt-8" aria-label="Pagination">
      {page > 1 && (
        <Link
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent"
          href={hrefFor(page - 1)}
        >
          Previous
        </Link>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent"
          href={hrefFor(page + 1)}
        >
          Next
        </Link>
      )}
    </nav>
  );
}
