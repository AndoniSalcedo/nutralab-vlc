'use client';

import { Skeleton, Stack } from '@mantine/core';

export default function TeamIntrapartidoLoading() {
  return (
    <Stack gap="lg">
      <Skeleton height={84} radius="lg" />
      <Skeleton height={120} radius="lg" />
      <Skeleton height={120} radius="lg" />
      <Skeleton height={120} radius="lg" />
    </Stack>
  );
}
