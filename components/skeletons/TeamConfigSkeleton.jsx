'use client';

import { Stack, Group, Paper, Skeleton, Table, Accordion } from '@mantine/core';

export default function TeamConfigSkeleton() {
  return (
    <Stack gap="lg">
      {/* Page Header Paper matching TeamConfigPage server layout */}
      <Paper p="md" radius="lg" shadow="sm" withBorder>
        <Group gap="md" align="center">
          <Skeleton height={42} width={42} radius="xl" />
          <Stack gap={4} style={{ flex: 1 }}>
            <Skeleton height={24} width={300} radius="md" />
            <Skeleton height={14} width={450} radius="sm" />
          </Stack>
        </Group>
      </Paper>

      {/* Body client configurations */}
      <Stack gap="xl">
        {/* Tipos de Dia card */}
        <Paper p="md" radius="lg" shadow="sm" withBorder>
          <Group justify="space-between" mb="md">
            <Skeleton height={18} width={120} radius="md" />
            <Skeleton height={30} width={80} radius="xl" />
          </Group>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th><Skeleton height={12} width={100} radius="sm" /></Table.Th>
                <Table.Th><Skeleton height={12} width={60} radius="sm" /></Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td><Skeleton height={14} width={140} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={14} width={60} radius="sm" /></Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Skeleton height={26} width={26} radius="sm" />
                      <Skeleton height={26} width={26} radius="sm" />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        {/* Accordion Card */}
        <Paper p="md" radius="lg" shadow="sm" withBorder>
          <Skeleton height={18} width={200} radius="md" mb="md" />
          
          <Accordion variant="separated">
            {Array.from({ length: 3 }).map((_, i) => (
              <Accordion.Item key={i} value={`mock-${i}`}>
                <Accordion.Control>
                  <Skeleton height={14} width={180} radius="sm" />
                </Accordion.Control>
              </Accordion.Item>
            ))}
          </Accordion>
        </Paper>

        {/* Action button */}
        <Group justify="flex-end">
          <Skeleton height={36} width={150} radius="xl" />
        </Group>
      </Stack>
    </Stack>
  );
}
