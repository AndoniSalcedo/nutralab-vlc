'use client';

import { useMemo, useState } from 'react';
import { Badge, Box, Collapse, Group, Paper, SimpleGrid, Stack, Table, Text, UnstyledButton } from '@mantine/core';
import SubtabHeader from '../SubtabHeader';
import classes from '../SubtabSectionHeader.module.css';
import Icon3D from '@/components/Icon3D';
import NothingFound from '@/components/NothingFound';
import { StatTile } from '@/components/widgets/WidgetCard';
import { IconChevronDown } from '@/components/icons3d';
import {
  PRODUCTS_MAP,
  buildSessionFromRows,
  calculatePlayerTotals,
} from '@/config/intrapartido';

function formatDate(dateStr) {
  if (!dateStr) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${dateStr}T00:00:00`));
}

function Stat({ label, value }) {
  return (
    <Box style={{ minWidth: 0 }}>
      <Text fz="10px" fw={600} c="dimmed" tt="uppercase" truncate>{label}</Text>
      <Text fz="sm" fw={700} c="dark.6" truncate>{value}</Text>
    </Box>
  );
}

export default function IntrapartidoSubtab({ jugador, historialIntrapartido = [] }) {
  const [expandedId, setExpandedId] = useState(null);
  const playerId = String(jugador.id);

  const matches = useMemo(() => historialIntrapartido.map(({ match, convocado, tomas }) => {
    const session = buildSessionFromRows(match, [convocado], tomas);
    const intakes = session.intakes[playerId] || {};
    return { session, intakes, isStarter: session.starterIds.includes(playerId), totals: calculatePlayerTotals(intakes) };
  }), [historialIntrapartido, playerId]);

  const averages = useMemo(() => {
    const n = matches.length || 1;
    const sum = (key) => matches.reduce((acc, m) => acc + m.totals[key], 0) / n;
    return { aguaMl: sum('aguaMl'), carbsG: sum('carbsG'), sodioMg: sum('sodioMg') };
  }, [matches]);

  return (
    <Stack gap="md">
      <Paper className={classes.mobileSticky} p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <SubtabHeader tab="metricas" subtab="intrapartido" />
      </Paper>

      {matches.length === 0 ? (
        <NothingFound
          title="Sin controles intrapartido"
          description="Cuando el nutricionista guarde un control de hidratación y nutrición de un partido en el que participes, aparecerá aquí."
          icon3d="stadium"
          withPaper
        />
      ) : (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            <StatTile icon="soccer" title="Partidos" color="salvia" value={matches.length} caption="con control" />
            <StatTile icon="droplet" title="Líquidos" color="salvia" value={Math.round(averages.aguaMl)} unit="ml" caption="por partido" />
            <StatTile icon="fire" title="Carbs" color="salvia" value={Math.round(averages.carbsG)} unit="g" caption="por partido" />
            <StatTile icon="running" title="Sodio" color="salvia" value={Math.round(averages.sodioMg)} unit="mg" caption="por partido" />
          </SimpleGrid>

          <Stack gap="sm">
            {matches.map(({ session, intakes, isStarter, totals }) => {
              const info = session.matchInfo;
              const expanded = expandedId === session.id;
              const phases = session.fases.filter((t) => Object.keys(intakes[t.id] || {}).length > 0);

              return (
                <Paper key={session.id} radius={24} shadow="xs" bg="white" p={{ base: 10, sm: 'md' }}>
                  <UnstyledButton
                    onClick={() => setExpandedId(expanded ? null : session.id)}
                    style={{ width: '100%' }}
                    aria-expanded={expanded}
                  >
                    <Group justify="space-between" wrap="nowrap" gap="xs">
                      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Icon3D name="soccer" size={28} />
                        <Box style={{ minWidth: 0 }}>
                          <Group gap={6} wrap="nowrap">
                            <Text fw={700} fz="sm" c="dark.6" truncate>{info.rival || 'Sin rival'}</Text>
                            <Badge size="xs" variant="light" color={isStarter ? 'green' : 'blue'}>
                              {isStarter ? 'Titular' : 'Suplente'}
                            </Badge>
                          </Group>
                          <Text fz="xs" c="dimmed" truncate>
                            {formatDate(info.fecha)}
                            {info.competicion ? ` · ${info.competicion}` : ''}
                            {info.lugar ? ` · ${info.lugar}` : ''}
                          </Text>
                        </Box>
                      </Group>
                      <IconChevronDown
                        size={17}
                        style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}
                      />
                    </Group>
                  </UnstyledButton>

                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs" mt="sm">
                    <Stat label="Líquidos" value={`${Math.round(totals.aguaMl)} ml`} />
                    <Stat label="Carbs" value={`${Math.round(totals.carbsG)} g`} />
                    <Stat label="Sodio" value={`${Math.round(totals.sodioMg)} mg`} />
                    <Stat label="Energía" value={`${Math.round(totals.kcal)} kcal`} />
                  </SimpleGrid>

                  <Collapse expanded={expanded}>
                    {phases.length === 0 ? (
                      <Text fz="xs" c="dimmed" mt="md">No se registraron tomas en este partido.</Text>
                    ) : (
                      <Table verticalSpacing="xs" mt="md" striped>
                        <Table.Thead bg="#f8fafc">
                          <Table.Tr>
                            <Table.Th style={{ fontSize: 11, color: 'var(--mantine-color-gray-6)' }}>MOMENTO</Table.Th>
                            <Table.Th style={{ fontSize: 11, color: 'var(--mantine-color-gray-6)' }}>TOMAS</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {phases.map((t) => (
                            <Table.Tr key={t.id}>
                              <Table.Td><Text fz="xs" fw={600} c="dark.6">{t.short}</Text></Table.Td>
                              <Table.Td>
                                <Text fz="xs" c="dark.5">
                                  {Object.entries(intakes[t.id])
                                    .map(([productId, qty]) => `${qty}× ${PRODUCTS_MAP.get(productId)?.nombre || productId}`)
                                    .join(' · ')}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
        </>
      )}
    </Stack>
  );
}
