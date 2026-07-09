'use client';

import { Stack, Group, Paper, Skeleton, Table, Accordion, ActionIcon, Title, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TeamConfigSkeleton() {
  const params = useParams();
  const teamId = params?.teamId;

  return (
    <Stack gap="lg">
      {/* Page Header Paper with REAL static elements */}
      <Paper p="md" radius="lg" shadow="sm" withBorder>
        <Group gap="md" align="center">
          <ActionIcon 
            component={Link} 
            href={teamId ? `/dashboard/equipo/${teamId}` : '/dashboard'} 
            variant="light" 
            color="gray" 
            radius="xl" 
            size={42}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={3} fw={700} c="#24291f">Configuración Nutricional</Title>
            <Text c="dimmed" size="sm" mt={2}>
              Personaliza los tipos de día y multiplicadores de macros que se usarán en este equipo.
            </Text>
          </div>
        </Group>
      </Paper>

      {/* Body client configurations */}
      <Stack gap="xl">
        {/* Tipos de Dia card */}
        <Paper p="md" radius="lg" shadow="sm" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>Tipos de Día</Title>
            <Skeleton height={30} width={80} radius="xl" />
          </Group>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tipo de Día</Table.Th>
                <Table.Th>Color</Table.Th>
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
          <Title order={4} mb="md">Multiplicadores por Objetivo</Title>
          
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
