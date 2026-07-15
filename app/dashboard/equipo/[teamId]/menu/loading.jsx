'use client';

import Skeleton from '@/components/bones/BoneyardSkeleton';

export default function TeamMenuLoading() {
  return <Skeleton name="team-menu" loading={true} />;
}
