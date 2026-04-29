'use client';

import { Stack, Group, SimpleGrid, Skeleton, Paper, Table, ScrollArea } from '@mantine/core';

export default function DashboardLoading() {
  const skeletonRows = Array.from({ length: 6 }).map((_, i) => (
    <Table.Tr key={i}>
      <Table.Td style={{ paddingLeft: 24 }}>
        <Group gap="sm">
          <Skeleton circle height={40} width={40} />
          <Skeleton height={16} width="60%" />
        </Group>
      </Table.Td>

      <Table.Td>
        <Skeleton height={16} width="70%" />
      </Table.Td>

      <Table.Td>
        <Skeleton height={16} width="60%" />
      </Table.Td>

      <Table.Td>
        <Skeleton height={16} width="60%" />
      </Table.Td>

      <Table.Td>
        <Skeleton height={16} width="50%" />
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      {/* Header skeleton */}
      <Paper
        p="md"
        bg="white"
        shadow="xs"
        radius={24}
        mb="lg"
      >
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Skeleton height={36} width={36} radius="xl" />
            <Skeleton height={24} width={200} />
          </Group>
          <Group gap="xs">
            <Skeleton height={30} width={100} radius="xl" />
            <Skeleton height={30} width={120} radius="xl" />
            <Skeleton height={30} width={120} radius="xl" />
            <Skeleton height={30} width={130} radius="xl" />
          </Group>
        </Group>
      </Paper>

      {/* KPI cards skeleton */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {[...Array(3)].map((_, i) => (
          <Paper key={i} withBorder radius="md" p="md">
            <Group gap="sm" mb="md">
              <Skeleton height={24} width={24} radius="xl" />
              <Skeleton height={20} width={120} />
            </Group>
            <Skeleton height={28} width={60} mb={8} />
            <Skeleton height={14} width={150} />
          </Paper>
        ))}
      </SimpleGrid>

      {/* Table skeleton */}
      <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
            <Table.Thead bg="gray.0">
              <Table.Tr>
                {['', '', '', '', ''].map((_, i) => (
                  <Table.Th key={i}>
                    <Skeleton height={14} width="80%" />
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{skeletonRows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
