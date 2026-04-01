export type EntryStatus = "planning" | "playing" | "completed" | "on_hold" | "dropped";

const labels: Record<EntryStatus, string> = {
  planning: "Not Started",
  playing: "Playing",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
};

const colors: Record<EntryStatus, string> = {
  playing:
    "bg-[#D7EBF9] text-[#4A52AC] border border-[#4A52AC]",
  completed:
    "bg-[#5DAE6E] text-white border border-[#5DAE6E]",
  planning:
    "bg-[#F4F4F4] text-app-muted border border-[#E0E0E0]",
  dropped:
    "bg-[#EBC6C6] text-[#822B34] border border-[#822B34]",
  on_hold:
    "bg-[#FFF3D6] text-[#B8860B] border border-[#E8C860]",
};

export function statusLabel(s: EntryStatus) {
  return labels[s] ?? s;
}

export function statusColor(s: EntryStatus) {
  return colors[s] ?? "bg-gray-400 text-white";
}

const STATUS_ORDER: EntryStatus[] = ["playing", "completed", "on_hold", "planning", "dropped"];

export const STATUS_OPTIONS: { value: EntryStatus; label: string }[] =
  STATUS_ORDER.map((value) => ({ value, label: labels[value] }));
