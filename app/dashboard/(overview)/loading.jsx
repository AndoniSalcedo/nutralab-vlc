'use client';

import Skeleton from '@/components/bones/BoneyardSkeleton';

export default function DashboardLoading() {
  return <Skeleton name="teams-list" loading={true} />;
}
