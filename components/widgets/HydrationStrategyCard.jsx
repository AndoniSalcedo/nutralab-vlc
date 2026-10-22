'use client';

import { useMemo } from 'react';
import { Box, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import Icon3D from '@/components/Icon3D';
import { buildHydrationStrategy } from '@/lib/nutrition/hydration-strategy';
import { todayKey } from '@/lib/dates';
import WidgetCard, { WidgetAside } from './WidgetCard';

const BOSQUE = 'var(--nutra-bosque, #1F2A24)';
const SALVIA = 'var(--nutra-salvia, #6C705A)';

const fmt = (value) => Math.round(Number(value) || 0).toLocaleString('es-ES');
const fmtL = (ml) => (ml / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 });

function Step({ icon, label, value, detail }) {
  return (
    <Box p={10} style={{ borderRadius: 16, backgroundColor: 'var(--mantine-color-hueso-1)', minWidth: 0 }}>
      <Group gap={6} wrap="nowrap">
        <Icon3D name={icon} size={18} />
        <Text fz={11} fw={700} c={SALVIA} truncate>{label}</Text>
      </Group>
      <Text fz={17} fw={800} c={BOSQUE} lh={1.15} mt={6} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</Text>
      {detail && <Text fz={10} fw={600} c={SALVIA} mt={3} lh={1.3}>{detail}</Text>}
    </Box>
  );
}

/**
 * "Lo que deberías beber": pauta personal según peso, sodio en sudor, osmolaridad e historial intrapartido.
 * Devuelve null si el jugador no tiene peso registrado (el padre muestra la pauta genérica).
 */
export default function HydrationStrategyCard({ jugador, registrosHidratacion = [], historialIntrapartido = [], compact = false }) {
  const strategy = useMemo(() => buildHydrationStrategy({
    jugadorId: jugador?.id,
    weightKg: jugador?.peso_kg,
    registrosHidratacion,
    historialIntrapartido,
    dayType: 'partido',
    today: todayKey(),
  }), [jugador?.id, jugador?.peso_kg, registrosHidratacion, historialIntrapartido]);

  if (!strategy) return null;
  const { plan, sodium, osm, history, tips } = strategy;

  return (
    <WidgetCard
      id="widget-hydration-strategy"
      icon="droplet"
      title="Tu estrategia de hidratación"
      color="blue"
      aside={sodium ? <WidgetAside color={sodium.key === 'bajo' ? 'lima' : sodium.key === 'moderado' ? 'salvia' : 'bosque'}>{sodium.label.replace('Sodio en sudor ', 'Sodio ')}</WidgetAside> : null}
      footer={history ? `${history.matches} ${history.matches === 1 ? 'partido controlado' : 'partidos controlados'}: ~${fmt(history.aguaMl)} ml · ${fmt(history.sodioMg)} mg sodio · ${fmt(history.carbsG)} g HC` : `Calculado para ${fmt(strategy.weightKg)} kg`}
      style={{ height: 'auto' }}
    >
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 2, sm: compact ? 2 : 5 }} spacing="xs">
          <Step icon="glass" label="Día de partido" value={`${fmtL(plan.dailyMl)} L`} detail={osm?.extraMl ? `Incluye +${fmt(osm.extraMl)} ml por tu osmolaridad` : 'Repartidos a lo largo del día'} />
          <Step icon="alarmclock" label="2-4 h antes" value={`${fmt(plan.pre.minMl)}-${fmt(plan.pre.maxMl)} ml`} detail="5-7 ml/kg, a sorbos" />
          <Step icon="running" label="Calentamiento" value={`${plan.warmupMl[0]}-${plan.warmupMl[1]} ml`} detail="Justo antes de salir" />
          <Step icon="soccer" label="Durante" value={`~${fmt(plan.during.totalMl)} ml`} detail={`≈${fmt(plan.during.perHourMl)} ml/h · descanso ~${fmt(plan.during.halftimeMl)} ml`} />
          <Step icon="battery" label="Después" value="1,25-1,5 L" detail="por cada kg perdido, con sal" />
        </SimpleGrid>

        <Group gap="xs" wrap="wrap">
          <WidgetAside color="salvia">Bebida: {fmt(plan.drinkSodiumMgL[0])}-{fmt(plan.drinkSodiumMgL[1])} mg sodio/L</WidgetAside>
          <WidgetAside color="salvia">Sodio por partido: {fmt(plan.sodiumMg[0])}-{fmt(plan.sodiumMg[1])} mg</WidgetAside>
          <WidgetAside color="salvia">Hidratos: {plan.carbsG[0]}-{plan.carbsG[1]} g</WidgetAside>
          {osm && <WidgetAside color={osm.level === 'optimo' ? 'lima' : 'arcilla'} dot>{osm.label}</WidgetAside>}
        </Group>

        {tips.length > 0 && (
          <Stack gap={4}>
            {tips.map((tip) => (
              <Group key={tip} gap={6} wrap="nowrap" align="flex-start">
                <IconCheck size={14} style={{ marginTop: 3, flexShrink: 0 }} color="var(--nutra-lima-dark, #4a6813)" />
                <Text fz="xs" c="dark.5" lh={1.4}>{tip}</Text>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </WidgetCard>
  );
}
