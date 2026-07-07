'use client';

import { Stack, Group, SimpleGrid, Skeleton, Paper, Table, ScrollArea, Grid } from '@mantine/core';

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
      {/* 1. RESUMEN / ACCIONES SKELETON */}
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
          zIndex: 10,
          position: 'relative'
        }}
      >
        <Stack gap="sm">
          <Grid align="center" gutter="md">
            {/* Left part: Back arrow and Team Stack skeleton */}
            <Grid.Col span={{ base: 12, md: 'content' }}>
              <Group gap="md" justify="center" align="center" wrap="nowrap" style={{ height: '100%' }}>
                <Skeleton height={42} width={42} radius="xl" />
                
                <Stack gap="xs" align="center" style={{ flex: 1, minWidth: 140 }}>
                  <Skeleton height={54} width={54} radius="xl" />
                  <Stack gap={4} align="center" w="100%">
                    <Skeleton height={20} width={120} radius="md" />
                    <Skeleton height={14} width={60} radius="md" />
                  </Stack>
                </Stack>
              </Group>
            </Grid.Col>

            {/* Right part: Grid of 8 buttons skeleton */}
            <Grid.Col span={{ base: 12, md: 'auto' }}>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs">
                {[...Array(8)].map((_, i) => (
                  <Paper
                    key={i}
                    px={{ base: 'sm', sm: 'md' }}
                    py={6}
                    radius="xl"
                    withBorder
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%',
                      minHeight: 56,
                      background: 'rgba(248,249,245,0.82)',
                      borderColor: 'rgba(222,226,230,0.9)',
                    }}
                  >
                    <Group gap="xs" wrap="nowrap" align="center" style={{ width: '100%' }}>
                      <Skeleton height={32} width={32} radius="md" />
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Skeleton height={10} width="60%" radius="sm" />
                        <Skeleton height={14} width="80%" radius="sm" />
                      </Stack>
                    </Group>
                  </Paper>
                ))}
              </SimpleGrid>
            </Grid.Col>
          </Grid>

          {/* Filter Bar Skeleton */}
          <Paper p={6} radius="xl" shadow="xs" withBorder bg="white" w="100%">
            <Group gap={8} w="100%" wrap="wrap" align="center">
              <Skeleton height={36} radius="xl" style={{ flex: 2, minWidth: 190 }} />
              <Skeleton height={36} radius="xl" style={{ flex: 2, minWidth: 190 }} />
              <Skeleton height={36} radius="xl" style={{ flex: 1, minWidth: 150 }} />
            </Group>
          </Paper>
        </Stack>
      </Paper>

      {/* 2. LISTADO DE JUGADORES (TABLA) SKELETON */}
      <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
            <Table.Thead bg="gray.0">
              <Table.Tr>
                <Table.Th style={{ paddingLeft: 24 }}><Skeleton height={14} width={100} /></Table.Th>
                <Table.Th><Skeleton height={14} width={120} /></Table.Th>
                <Table.Th><Skeleton height={14} width={120} /></Table.Th>
                <Table.Th><Skeleton height={14} width={80} /></Table.Th>
                <Table.Th w={70} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{skeletonRows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
