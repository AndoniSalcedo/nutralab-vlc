'use client';
import { Stack, Group, Skeleton, Paper, Table, ScrollArea, Box, ActionIcon, ThemeIcon, Title, Text, SimpleGrid } from '@mantine/core';
import { IconArrowLeft, IconReportMedical } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TeamAnalyticsSkeleton() {
  const params = useParams();
  const teamId = params?.teamId;

  return (
    <Stack gap="lg">
      {/* Cabecera */}
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
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="sm" wrap="nowrap">
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
            <ThemeIcon color="red" variant="light" radius="xl" size={42}>
              <IconReportMedical size={21} />
            </ThemeIcon>
            <Box>
              <Title order={3} fw={850} c="#24291f" lh={1.1}>
                Analíticas de equipo
              </Title>
              <Text size="xs" c="dimmed" mt={2}>
                Panel clínico de rendimiento y alertas biológicas del grupo
              </Text>
            </Box>
          </Group>
        </Group>
      </Paper>

      {/* Tarjetas de estadísticas */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        {Array.from({ length: 4 }).map((_, i) => (
          <Paper key={i} p="md" radius="lg" withBorder shadow="sm" bg="white">
            <Group justify="space-between" wrap="nowrap" mb={8}>
              <Skeleton height={12} width={100} radius="sm" />
              <Skeleton circle height={20} width={20} />
            </Group>
            <Skeleton height={24} width={70} radius="sm" mb={6} />
            <Skeleton height={10} width={120} radius="sm" />
          </Paper>
        ))}
      </SimpleGrid>

      {/* Inspector de Biomarcadores */}
      <Paper p="md" radius="lg" withBorder bg="white">
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <div>
              <Skeleton height={16} width={160} radius="sm" mb={6} />
              <Skeleton height={10} width={250} radius="sm" />
            </div>
            <Group gap="sm" wrap="wrap">
              <Skeleton height={32} width={180} radius="xl" />
              <Skeleton height={36} width={240} radius="xl" />
            </Group>
          </Group>
          <Skeleton height={280} w="100%" radius="md" />
        </Stack>
      </Paper>

      {/* Listado Clínico General */}
      <Paper radius="lg" p="md" bg="white" shadow="sm" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Skeleton height={18} width={150} radius="sm" />
            <Group gap="xs" wrap="wrap">
              <Skeleton height={36} width={200} radius="xl" />
              <Skeleton height={36} width={170} radius="xl" />
              <Skeleton height={36} width={155} radius="xl" />
            </Group>
          </Group>

          <Skeleton height={32} w="100%" radius="xl" />

          <ScrollArea>
            <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th style={{ paddingLeft: 16 }}>Jugador</Table.Th>
                  <Table.Th>Última Analítica</Table.Th>
                  <Table.Th>Historial</Table.Th>
                  <Table.Th>Parámetros Fuera de Rango</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td style={{ paddingLeft: 16 }}>
                      <Group gap="xs" wrap="nowrap">
                        <Skeleton circle height={36} width={36} />
                        <Skeleton height={14} width={120} radius="sm" />
                      </Group>
                    </Table.Td>
                    <Table.Td><Skeleton height={14} width={80} radius="sm" /></Table.Td>
                    <Table.Td><Skeleton height={14} width={60} radius="sm" /></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Skeleton height={22} width={110} radius="sm" />
                        <Skeleton height={22} width={90} radius="sm" />
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Paper>
    </Stack>
  );
}
