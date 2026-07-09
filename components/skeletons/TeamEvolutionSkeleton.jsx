'use client';

import { Stack, Group, Skeleton, Paper, Table, ScrollArea, Box } from '@mantine/core';

export default function TeamEvolutionSkeleton() {
  return (
    <Stack gap="lg">
      {/* Header & Filters Paper */}
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
          zIndex: 10,
          position: 'relative',
        }}
      >
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm" wrap="nowrap">
              <Skeleton height={42} width={42} radius="xl" />
              <Skeleton height={42} width={42} radius="xl" />
              <Box>
                <Skeleton height={22} width={180} radius="md" />
                <Skeleton height={12} width={150} radius="sm" mt={4} />
              </Box>
            </Group>
            <Group gap="xs" wrap="wrap" justify="flex-end">
              <Skeleton height={38} width={380} radius="xl" />
              <Skeleton height={36} width={70} radius="xl" />
            </Group>
          </Group>

          {/* Filters inside the header Paper */}
          <Paper p={6} radius="xl" shadow="xs" withBorder bg="white" w="100%">
            <Group gap={8} w="100%" wrap="wrap" align="center">
              <Skeleton height={36} radius="xl" style={{ flex: 1, minWidth: 170 }} />
              <Skeleton height={36} radius="xl" style={{ flex: 1, minWidth: 180 }} />
              <Skeleton height={36} radius="xl" style={{ flex: 1, minWidth: 180 }} />
              <Skeleton height={36} radius="xl" style={{ flex: 1, minWidth: 180 }} />
            </Group>
          </Paper>
        </Stack>
      </Paper>

      {/* Chart Skeleton */}
      <Paper p="md" radius="lg" withBorder shadow="sm" bg="white">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Skeleton height={18} width={140} radius="md" />
            <Skeleton height={14} width={100} radius="sm" />
          </Group>
          <Skeleton height={280} w="100%" radius="md" />
        </Stack>
      </Paper>

      {/* Table Skeleton */}
      <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
            <Table.Thead bg="gray.0">
              <Table.Tr>
                <Table.Th style={{ paddingLeft: 24 }}><Skeleton height={14} width={80} /></Table.Th>
                <Table.Th><Skeleton height={14} width={60} /></Table.Th>
                <Table.Th><Skeleton height={14} width={60} /></Table.Th>
                <Table.Th><Skeleton height={14} width={60} /></Table.Th>
                <Table.Th><Skeleton height={14} width={100} /></Table.Th>
                <Table.Th w={80} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td style={{ paddingLeft: 24 }}>
                    <Group gap="sm" wrap="nowrap">
                      <Skeleton circle height={36} width={36} />
                      <Skeleton height={14} width={120} radius="sm" />
                    </Group>
                  </Table.Td>
                  <Table.Td><Skeleton height={14} width={60} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={14} width={60} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={14} width={60} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={14} width={100} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={24} width={60} radius="xl" /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
