import type { EntryStatus } from "@/lib/status";

type StatusCounts = Record<EntryStatus, number>;

export type ProfileStatsData = {
  statusCounts: StatusCounts;
  totalEntries: number;
  meanScore: number | null;
  routesCompleted: number;
  routesTotal: number;
};

const BAR_COLORS: Record<EntryStatus, string> = {
  playing: "#4A90D9",
  completed: "#5DAE6E",
  on_hold: "#E8C860",
  dropped: "#C25450",
  planning: "#9E9E9E",
};

const DOT_COLORS: Record<EntryStatus, string> = {
  playing: "#4A90D9",
  completed: "#5DAE6E",
  on_hold: "#E8C860",
  dropped: "#C25450",
  planning: "#9E9E9E",
};

const STATUS_ORDER: EntryStatus[] = ["playing", "completed", "on_hold", "dropped", "planning"];
const STATUS_LABELS: Record<EntryStatus, string> = {
  playing: "Playing",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
  planning: "Not Started",
};

export function ProfileStats({ data }: { data: ProfileStatsData }) {
  const { statusCounts, totalEntries, meanScore, routesCompleted, routesTotal } = data;

  const barSegments = STATUS_ORDER.map((s) => ({
    status: s,
    count: statusCounts[s] ?? 0,
    pct: totalEntries > 0 ? ((statusCounts[s] ?? 0) / totalEntries) * 100 : 0,
  })).filter((seg) => seg.count > 0);

  return (
    <div className="min-w-0 space-y-4">
      <h2 className="text-[16px] font-bold text-app-muted">Game Statistics</h2>

      {/* Colored proportional bar */}
      {totalEntries > 0 ? (
        <div className="flex h-3 overflow-hidden rounded-full">
          {barSegments.map((seg) => (
            <div
              key={seg.status}
              className="transition-all"
              style={{
                width: `${Math.max(seg.pct, 2)}%`,
                backgroundColor: BAR_COLORS[seg.status],
              }}
              title={`${STATUS_LABELS[seg.status]}: ${seg.count}`}
            />
          ))}
        </div>
      ) : (
        <div className="h-3 rounded-full bg-muted" />
      )}

      {/* Two-column stats */}
      <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-1">
        {/* Left: status breakdown */}
        <div className="min-w-0 space-y-1">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex min-w-0 items-center justify-between gap-2 text-[13px]">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: DOT_COLORS[s] }}
                />
                <span className="truncate text-muted-foreground">{STATUS_LABELS[s]}</span>
              </span>
              <span className="font-medium text-app-muted">{statusCounts[s] ?? 0}</span>
            </div>
          ))}
        </div>

        {/* Right: aggregate stats */}
        <div className="min-w-0 space-y-1">
          <StatRow label="Total Games" value={String(totalEntries)} />
          <StatRow
            label="Mean Score"
            value={meanScore != null ? meanScore.toFixed(2) : "—"}
          />
          <StatRow label="Routes Completed" value={String(routesCompleted)} />
          <StatRow label="Total Routes" value={String(routesTotal)} />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 text-[13px]">
      <span className="truncate text-muted-foreground">{label}</span>
      <span className="font-medium text-app-muted">{value}</span>
    </div>
  );
}

export function ProfileStatsSidebar({ data, compact }: { data: ProfileStatsData; compact?: boolean }) {
  const { statusCounts, totalEntries } = data;

  const barSegments = STATUS_ORDER.map((s) => ({
    status: s,
    count: statusCounts[s] ?? 0,
    pct: totalEntries > 0 ? ((statusCounts[s] ?? 0) / totalEntries) * 100 : 0,
  })).filter((seg) => seg.count > 0);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-app-muted">Game Stats</h3>
        <span className="text-[13px] text-muted-foreground"><span className="font-bold text-app-muted">{totalEntries}</span> total</span>
      </div>

      {totalEntries > 0 ? (
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {barSegments.map((seg) => (
            <div
              key={seg.status}
              className="transition-all"
              style={{
                width: `${Math.max(seg.pct, 2)}%`,
                backgroundColor: BAR_COLORS[seg.status],
              }}
              title={`${STATUS_LABELS[seg.status]}: ${seg.count}`}
            />
          ))}
        </div>
      ) : (
        <div className="h-2.5 rounded-full bg-muted" />
      )}

      <div className="min-w-0 space-y-1">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="flex min-w-0 items-center justify-between gap-2 text-[12px]">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: DOT_COLORS[s] }}
              />
              <span className="truncate text-muted-foreground">{STATUS_LABELS[s]}</span>
            </span>
            <span className="font-medium text-app-muted">{statusCounts[s] ?? 0}</span>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="border-t border-border pt-2">
          <div className="flex min-w-0 items-center justify-between gap-2 text-[12px]">
            <span className="truncate text-muted-foreground">Total Games</span>
            <span className="font-bold text-app-muted">{totalEntries}</span>
          </div>
        </div>
      )}
    </div>
  );
}
