import { ProfileStatsSidebar, type ProfileStatsData } from "@/app/u/[handle]/profile-stats";

export function ExploreHomeSidebar({ stats }: { stats: ProfileStatsData }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-3 text-[16px] font-bold text-[#646373]">My Statistics</h2>
        <ProfileStatsSidebar data={stats} compact />
      </div>

      <div className="border-t border-border pt-5">
        <h2 className="text-[16px] font-bold text-[#646373]">Friend Updates</h2>
        <p className="mt-3 text-[12px] text-muted-foreground">
          No friend updates yet.
        </p>
      </div>
    </div>
  );
}
