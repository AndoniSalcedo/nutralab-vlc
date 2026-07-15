'use client';

import Skeleton from '@/components/bones/BoneyardSkeleton';

export default function TeamDashboardLoading() {
  return <Skeleton name="team-dashboard" loading={true} />;
}
