'use client';

import { useMemo, useState } from 'react';
import { Badge, Box, Group, ScrollArea, Select, Stack, Table, Text } from '@mantine/core';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BentoCard } from '@/components/BentoItem';
import { IconChartLine, IconTrendingUp } from '@/components/icons3d';
import { compareRecords, formatDelta, sortByDateDesc, TREND_META } from '@/lib/analytics/compare';

function fechaCorta(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function recordLabel(a) {
  return `${fechaCorta(a.fecha_extraccion)} · ${a.pdf_nombre || 'Analítica'}`;
}

export default function AnaliticasEvolucion({ analiticas = [], selectedId }) {
  const sorted = useMemo(() => sortByDateDesc(analiticas), [analiticas]);
  const [baseOverride, setBaseOverride] = useState(null);
  const [paramOverride, setParamOverride] = useState(null);

  const current = sorted.find((a) => String(a.id) === String(selectedId)) || sorted[0];
  const currentIndex = sorted.findIndex((a) => a.id === current?.id);
  const defaultBase = sorted[currentIndex + 1] || sorted.find((a) => a.id !== current?.id);
  const base = sorted.find((a) => String(a.id) === String(baseOverride) && a.id !== current?.id) || defaultBase;

  const rows = useMemo(() => (current && base ? compareRecords(current, base) : []), [current, base]);

  const paramNames = useMemo(() => {
    const names = new Set();
    sorted.forEach((a) => (a.parametros || []).forEach((p) => p.nombre && names.add(p.nombre)));
    return Array.from(names).sort();
  }, [sorted]);

  const selectedParam =
    paramOverride && paramNames.includes(paramOverride)
      ? paramOverride
      : (current?.parametros || []).find((p) => p.fuera_rango)?.nombre || paramNames[0] || null;

  const series = useMemo(() => {
    if (!selectedParam) return { data: [], unidad: '', min: null, max: null };
    const data = [];
    let unidad = '';
    let min = null;
    let max = null;
    [...sorted].reverse().forEach((a) => {
      const p = (a.parametros || []).find((x) => x.nombre === selectedParam);
      if (!p) return;
      unidad = p.unidad || unidad;
      if (p.rango_min !== null && p.rango_min !== undefined && p.rango_min !== '') min = Number(p.rango_min);
      if (p.rango_max !== null && p.rango_max !== undefined && p.rango_max !== '') max = Number(p.rango_max);
      data.push({ label: fechaCorta(a.fecha_extraccion), valor: Number(p.valor) });
    });
    return { data, unidad, min, max };
  }, [sorted, selectedParam]);

  if (sorted.length < 2 || !current || !base) return null;

  const resumen = rows.reduce(
    (acc, r) => ({ ...acc, [r.trend]: acc[r.trend] + 1 }),
    { mejora: 0, empeora: 0, estable: 0 }
  );
  const orderedRows = [...rows].sort((a, b) => {
    const rank = { empeora: 0, mejora: 1, estable: 2 };
    return rank[a.trend] - rank[b.trend] || Math.abs(b.pct ?? 0) - Math.abs(a.pct ?? 0);
  });

  return (
    <Stack gap={0}>
      <BentoCard title="Comparación con analítica anterior" icon={IconTrendingUp} color="salvia" mb={{ base: 'md', sm: 'lg' }}>
        <Stack gap="sm">
          <Group gap="xs" wrap="wrap">
            <Select
              label="Comparar con"
              data={sorted.filter((a) => a.id !== current.id).map((a) => ({ value: String(a.id), label: recordLabel(a) }))}
              value={String(base.id)}
              onChange={(val) => val && setBaseOverride(val)}
              allowDeselect={false}
              searchable
              radius="xl"
              size="xs"
              style={{ flex: '1 1 240px', minWidth: 0 }}
            />
            <Group gap={6} align="flex-end" pb={2}>
              <Badge variant="light" color="salvia">{resumen.mejora} mejoran</Badge>
              <Badge variant="light" color="arcilla">{resumen.empeora} empeoran</Badge>
              <Badge variant="light" color="gray">{resumen.estable} estables</Badge>
            </Group>
          </Group>

          {rows.length === 0 ? (
            <Text size="sm" c="dimmed">Las dos analíticas no comparten parámetros.</Text>
          ) : (
            <ScrollArea>
              <Table verticalSpacing="xs" highlightOnHover style={{ minWidth: 520 }}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th>Parámetro</Table.Th>
                    <Table.Th>{fechaCorta(base.fecha_extraccion)}</Table.Th>
                    <Table.Th>{fechaCorta(current.fecha_extraccion)}</Table.Th>
                    <Table.Th>Variación</Table.Th>
                    <Table.Th>Tendencia</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {orderedRows.map((r) => {
                    const meta = TREND_META[r.trend];
                    const arrow = r.delta > 0 ? '↑' : r.delta < 0 ? '↓' : '→';
                    return (
                      <Table.Tr key={r.nombre} style={{ cursor: 'pointer' }} onClick={() => setParamOverride(r.nombre)}>
                        <Table.Td><Text size="sm" fw={600}>{r.nombre}</Text></Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{r.anterior} {r.unidad}</Text></Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={700} c={r.parametro.fuera_rango ? 'arcilla' : 'salvia'}>{r.valor} {r.unidad}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {arrow} {formatDelta(r.delta)}
                            {r.pct !== null && <Text span size="xs" c="dimmed"> ({formatDelta(r.pct)}%)</Text>}
                          </Text>
                        </Table.Td>
                        <Table.Td><Badge variant="light" color={meta.color} size="sm">{meta.label}</Badge></Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Stack>
      </BentoCard>

      <BentoCard title="Evolución histórica" icon={IconChartLine} color="salvia" mb={{ base: 'md', sm: 'lg' }}>
        <Stack gap="sm">
          <Select
            label="Parámetro"
            data={paramNames}
            value={selectedParam}
            onChange={(val) => val && setParamOverride(val)}
            allowDeselect={false}
            searchable
            radius="xl"
            size="xs"
          />
          <Box h={260}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.data} margin={{ top: 10, right: 16, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mantine-color-gray-2)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <ChartTooltip
                  formatter={(v) => [`${v} ${series.unidad}`, selectedParam]}
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--mantine-color-gray-2)', fontSize: 11 }}
                />
                {Number.isFinite(series.min) && Number.isFinite(series.max) && (
                  <ReferenceArea y1={series.min} y2={series.max} fill="rgba(16, 185, 129, 0.07)" stroke="rgba(16, 185, 129, 0.15)" strokeDasharray="3 3" />
                )}
                <Line type="monotone" dataKey="valor" stroke="#6C705A" strokeWidth={2} dot={{ r: 4, fill: '#6C705A' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Stack>
      </BentoCard>
    </Stack>
  );
}
