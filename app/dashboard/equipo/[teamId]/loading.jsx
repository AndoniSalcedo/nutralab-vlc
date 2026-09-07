'use client';

import { Paper, Skeleton, Stack, Group } from '@mantine/core';

export default function TeamDashboardLoading() {
  return (
    <Stack gap="md">
      <Paper p="lg" radius={24} withBorder bg="white" shadow="xs" style={{ borderColor: 'rgba(222,226,230,0.85)' }}>
        <Group justify="space-between" mb="lg">
          <Skeleton height={36} width={240} radius="xl" />
          <Skeleton height={36} width={120} radius="xl" />
        </Group>
        <Stack gap="sm">
          <Skeleton height={60} radius="lg" />
          <Skeleton height={60} radius="lg" />
          <Skeleton height={60} radius="lg" />
          <Skeleton height={60} radius="lg" />
          <Skeleton height={60} radius="lg" />
        </Stack>
      </Paper>
    </Stack>
  );
}
