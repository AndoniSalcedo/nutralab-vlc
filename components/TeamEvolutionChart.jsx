'use client';

import { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Stack, Group, Button, Box, Title, Text, SimpleGrid, Paper } from '@mantine/core';
import { IconChartLine } from '@tabler/icons-react';
import { BentoCard } from './Bento/BentoItem';

export default function TeamEvolutionChart({ teamEvolutions = [] }) {
  const [metrica, setMetrica] = useState('peso_kg');

  const METRICAS = [
    { key: 'peso_kg', label: 'Peso Medio (kg)', color: '#3b82f6' },
    { key: 'porcentaje_grasa', label: '% Grasa Medio', color: '#ef4444' },
    { key: 'masa_magra_kg', label: 'Masa Magra Media (kg)', color: '#22c55e' },
  ];

  const metricaActual = METRICAS.find(m => m.key === metrica) || METRICAS[0];

  // Agrupar evoluciones por fecha y calcular medias
  const aggregatedData = useMemo(() => {
    const dataByDate = {};

    teamEvolutions.forEach(evo => {
      if (!evo.fecha) return;
      if (!dataByDate[evo.fecha]) {
        dataByDate[evo.fecha] = {
          fecha: evo.fecha,
          count: 0,
          peso_kg_sum: 0,
          porcentaje_grasa_sum: 0,
          masa_magra_kg_sum: 0,
        };
      }
      
      const g = dataByDate[evo.fecha];
      let hasData = false;
      
      if (evo.peso_kg) { g.peso_kg_sum += Number(evo.peso_kg); hasData = true; }
      if (evo.porcentaje_grasa) { g.porcentaje_grasa_sum += Number(evo.porcentaje_grasa); hasData = true; }
      if (evo.masa_magra_kg) { g.masa_magra_kg_sum += Number(evo.masa_magra_kg); hasData = true; }
      
      if (hasData) g.count += 1;
    });

    return Object.values(dataByDate)
      .map(g => ({
        fecha: g.fecha,
        peso_kg: g.count > 0 ? Number((g.peso_kg_sum / g.count).toFixed(1)) : null,
        porcentaje_grasa: g.count > 0 ? Number((g.porcentaje_grasa_sum / g.count).toFixed(1)) : null,
        masa_magra_kg: g.count > 0 ? Number((g.masa_magra_kg_sum / g.count).toFixed(1)) : null,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [teamEvolutions]);

  if (aggregatedData.length === 0) {
    return null; // O mostrar un placeholder
  }

  const ultima = aggregatedData[aggregatedData.length - 1];

  return (
    <Stack gap="lg" mt="xl">
      <BentoCard title="Evolución Media del Equipo" icon={IconChartLine} color="blue">
        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <Group gap="xs">
              {METRICAS.map(m => (
                <Button 
                  key={m.key} 
                  variant={metrica === m.key ? 'filled' : 'light'} 
                  color={metrica === m.key ? 'blue' : 'gray'}
                  size="xs" 
                  onClick={() => setMetrica(m.key)}
                  radius="xl"
                >
                  {m.label}
                </Button>
              ))}
            </Group>
            
            {ultima && (
              <Box ta="right">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Último Registro</Text>
                <Title order={3} c={metricaActual.color}>
                  {ultima[metrica] ?? '-'}
                </Title>
              </Box>
            )}
          </Group>
          
          <Box h={250}>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--mantine-color-gray-2)' vertical={false} />
                <XAxis dataKey='fecha' tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="var(--mantine-color-gray-5)" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} stroke="var(--mantine-color-gray-5)" axisLine={false} tickLine={false} />
                <Tooltip 
                  labelStyle={{ fontWeight: 700, color: 'var(--mantine-color-dark-4)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Line 
                  type='monotone' 
                  dataKey={metrica} 
                  stroke={metricaActual.color} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: metricaActual.color, strokeWidth: 2, stroke: 'white' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                  connectNulls 
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Stack>
      </BentoCard>
    </Stack>
  );
}
