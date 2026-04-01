import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

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
    <nav className="flex items-center justify-center gap-3 pt-4" aria-label="Pagination">
      {page > 1 ? (
        <Link
          className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted hover:bg-[#E8E8E8] dark:hover:bg-[#2a2a35]"
          href={hrefFor(page - 1)}
          scroll={false}
        >
          <CaretLeft size={16} weight="bold" />
        </Link>
      ) : (
        <span className="flex h-8 w-8 items-center justify-center text-muted-foreground/30">
          <CaretLeft size={16} weight="bold" />
        </span>
      )}
      <span className="text-[13px] text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted hover:bg-[#E8E8E8] dark:hover:bg-[#2a2a35]"
          href={hrefFor(page + 1)}
          scroll={false}
        >
          <CaretRight size={16} weight="bold" />
        </Link>
      ) : (
        <span className="flex h-8 w-8 items-center justify-center text-muted-foreground/30">
          <CaretRight size={16} weight="bold" />
        </span>
      )}
    </nav>
  );
}
