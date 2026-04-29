'use client';

import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Paper, 
  Stack, 
  Group, 
  Title, 
  Text, 
  Button, 
  Badge, 
  SimpleGrid, 
  TextInput, 
  Table,
  UnstyledButton,
  Box,
  Divider,
  ActionIcon
} from '@mantine/core';
import { IconPlus, IconHistory, IconChartLine, IconCheck, IconTrash } from '@tabler/icons-react';
import { BentoCard } from './Bento/BentoItem';

export default function EvolucionTab({ jugadorId, evolucionesIniciales }) {
  const [evoluciones, setEvoluciones] = useState(evolucionesIniciales);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [metrica, setMetrica] = useState('peso_kg');
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    peso_kg: '', porcentaje_grasa: '', masa_magra_kg: '', suma_6_pliegues: '', notas: '',
  });

  const METRICAS = [
    { key: 'peso_kg', label: 'Peso (kg)', color: '#3b82f6' },
    { key: 'porcentaje_grasa', label: '% Grasa', color: '#ef4444' },
    { key: 'masa_magra_kg', label: 'Masa magra (kg)', color: '#22c55e' },
    { key: 'suma_6_pliegues', label: 'Suma 6 pliegues (mm)', color: '#f59e0b' },
  ];

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/evoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador_id: jugadorId, ...form,
          peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
          porcentaje_grasa: form.porcentaje_grasa ? Number(form.porcentaje_grasa) : null,
          masa_magra_kg: form.masa_magra_kg ? Number(form.masa_magra_kg) : null,
          suma_6_pliegues: form.suma_6_pliegues ? Number(form.suma_6_pliegues) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvoluciones(prev => {
        const filtered = prev.filter(e => e.fecha !== data.evolucion.fecha);
        return [...filtered, data.evolucion].sort((a,b) => a.fecha.localeCompare(b.fecha));
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const metricaActual = METRICAS.find(m => m.key === metrica) || METRICAS[0];
  const ultimasMediciones = [...evoluciones].reverse().slice(0, 5);
  const primera = evoluciones[0];
  const ultima = evoluciones[evoluciones.length - 1];
  
  const diff = (key) => {
    if (!primera || !ultima || primera === ultima) return null;
    const d = Number(ultima[key]) - Number(primera[key]);
    return {
      val: d > 0 ? '+' + d.toFixed(1) : d.toFixed(1),
      color: d > 0 ? (key === 'masa_magra_kg' ? 'green' : 'red') : (key === 'masa_magra_kg' ? 'red' : 'green')
    };
  };

  return (
    <Stack gap="lg">
      <Paper radius="lg" p="md" withBorder shadow="sm">
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4}>Registrar medición</Title>
            <Group gap="xs">
              {saved && <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>Guardado</Badge>}
              <Button leftSection={<IconPlus size={16} />} onClick={handleSave} loading={saving} size="xs">
                Guardar
              </Button>
            </Group>
          </Group>
          
          <SimpleGrid cols={{ base: 2, sm: 3, md: 5, lg: 6 }} spacing="xs">
            <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} size="xs" />
            <TextInput label="Peso (kg)" type="number" value={form.peso_kg} onChange={e => setForm(f => ({ ...f, peso_kg: e.target.value }))} size="xs" />
            <TextInput label="% Grasa" type="number" value={form.porcentaje_grasa} onChange={e => setForm(f => ({ ...f, porcentaje_grasa: e.target.value }))} size="xs" />
            <TextInput label="Masa magra (kg)" type="number" value={form.masa_magra_kg} onChange={e => setForm(f => ({ ...f, masa_magra_kg: e.target.value }))} size="xs" />
            <TextInput label="Σ6 pliegues (mm)" type="number" value={form.suma_6_pliegues} onChange={e => setForm(f => ({ ...f, suma_6_pliegues: e.target.value }))} size="xs" />
            <TextInput label="Notas" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} size="xs" />
          </SimpleGrid>
          
          {error && <Text c="red" size="xs">{error}</Text>}
        </Stack>
      </Paper>

      {evoluciones.length === 0 ? (
        <Paper p="xl" radius="lg" withBorder shadow="sm" style={{ textAlign: 'center' }}>
          <Text c="dimmed">Sin mediciones registradas. Añade la primera arriba para visualizar la evolución.</Text>
        </Paper>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {[
              { label: 'Peso actual', key: 'peso_kg', unit: 'kg' },
              { label: '% Grasa actual', key: 'porcentaje_grasa', unit: '%' },
              { label: 'Masa magra actual', key: 'masa_magra_kg', unit: 'kg' },
            ].map(m => {
              const d = diff(m.key);
              return (
                <Paper key={m.key} p="md" radius="lg" withBorder shadow="xs" style={{ borderLeft: '4px solid var(--mantine-color-blue-filled)' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{m.label}</Text>
                  <Group justify="space-between" align="flex-end" mt={5}>
                    <Title order={2}>{ultima?.[m.key] ?? '-'} {m.unit}</Title>
                    {d && (
                      <Badge variant="light" color={d.color} size="sm">
                        {d.val} {m.unit}
                      </Badge>
                    )}
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>

          <BentoCard title="Gráfico de Evolución" icon={IconChartLine} color="blue">
            <Stack gap="md">
              <Group gap="xs">
                {METRICAS.map(m => (
                  <Button 
                    key={m.key} 
                    variant={metrica === m.key ? 'filled' : 'light'} 
                    color={metrica === m.key ? 'blue' : 'gray'}
                    size="compact-xs" 
                    onClick={() => setMetrica(m.key)}
                    radius="xl"
                  >
                    {m.label}
                  </Button>
                ))}
              </Group>
              
              <Box h={300} mt="md">
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={evoluciones} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray='3 3' stroke='var(--mantine-color-gray-2)' />
                    <XAxis dataKey='fecha' tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="var(--mantine-color-gray-5)" />
                    <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} stroke="var(--mantine-color-gray-5)" />
                    <Tooltip 
                      labelStyle={{ fontWeight: 700, color: 'var(--mantine-color-dark-4)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--mantine-color-gray-3)' }}
                    />
                    <Line 
                      type='monotone' 
                      dataKey={metrica} 
                      stroke={metricaActual.color} 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: metricaActual.color, strokeWidth: 2, stroke: 'white' }} 
                      activeDot={{ r: 6, strokeWidth: 0 }} 
                      connectNulls 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </BentoCard>

          <BentoCard title="Historial de Mediciones" icon={IconHistory} color="gray">
            <Box style={{ overflowX: 'auto' }}>
              <Table variant="simple" verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Peso</Table.Th>
                    <Table.Th>% Grasa</Table.Th>
                    <Table.Th>Masa magra</Table.Th>
                    <Table.Th>Σ6 pliegues</Table.Th>
                    <Table.Th>Notas</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ultimasMediciones.map(e => (
                    <Table.Tr key={e.id}>
                      <Table.Td><Text size="sm" fw={600}>{e.fecha}</Text></Table.Td>
                      <Table.Td><Text size="sm">{e.peso_kg ?? '-'} kg</Text></Table.Td>
                      <Table.Td><Text size="sm">{e.porcentaje_grasa ?? '-'} %</Text></Table.Td>
                      <Table.Td><Text size="sm">{e.masa_magra_kg ?? '-'} kg</Text></Table.Td>
                      <Table.Td><Text size="sm">{e.suma_6_pliegues ?? '-'} mm</Text></Table.Td>
                      <Table.Td><Text size="xs" c="dimmed" lineClamp={1}>{e.notas || '-'}</Text></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </BentoCard>
        </>
      )}
    </Stack>
  );
}