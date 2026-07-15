'use client';

import Skeleton from '@/components/bones/BoneyardSkeleton';

export default function TeamEvolutionLoading() {
  return <Skeleton name="team-evolution" loading={true} />;
}
