'use client';

import { Stack, Group, Skeleton, Paper, Table, ScrollArea, Box } from '@mantine/core';

export default function TeamSupplementationSkeleton() {
  return (
    <Stack gap="lg">
      {/* Header Paper Skeleton */}
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="sm" wrap="nowrap">
            <Skeleton height={42} width={42} radius="xl" />
            <Skeleton height={42} width={42} radius="xl" />
            <Box>
              <Skeleton height={22} width={150} radius="md" />
              <Skeleton height={12} width={100} radius="sm" mt={4} />
            </Box>
          </Group>
          <Group gap="xs">
            <Skeleton height={30} width={110} radius="xl" />
            <Skeleton height={30} width={90} radius="xl" />
            <Skeleton height={30} width={110} radius="xl" />
          </Group>
        </Group>
      </Paper>

      {/* Players List Table Skeleton */}
      <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 600 }}>
            <Table.Thead bg="gray.0">
              <Table.Tr>
                <Table.Th style={{ paddingLeft: 24 }}><Skeleton height={14} width={80} /></Table.Th>
                <Table.Th><Skeleton height={14} width={150} /></Table.Th>
                <Table.Th><Skeleton height={14} width={80} /></Table.Th>
                <Table.Th w={120} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <Table.Tr key={i} h={70}>
                  <Table.Td style={{ paddingLeft: 24 }}>
                    <Group gap="sm" wrap="nowrap">
                      <Skeleton circle height={42} width={42} />
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Skeleton height={14} width={120} radius="sm" />
                        <Skeleton height={10} width={70} radius="sm" />
                      </Stack>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={16} width={140} radius="sm" />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={20} width={80} radius="sm" />
                  </Table.Td>
                  <Table.Td>
                    <Skeleton height={24} width={80} radius="xl" />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
