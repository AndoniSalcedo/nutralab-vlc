'use client';

import Skeleton from '@/components/bones/BoneyardSkeleton';

export default function TeamConfigLoading() {
  return <Skeleton name="team-config" loading={true} />;
}
