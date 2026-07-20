'use client';

import Skeleton from '@/components/bones/BoneyardSkeleton';

export default function PlayerDashboardLoading() {
  return <Skeleton name="player-dashboard" loading={true} minY={230} />;
}
