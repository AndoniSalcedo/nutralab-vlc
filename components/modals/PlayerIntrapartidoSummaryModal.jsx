'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import ResponsiveModal from './ResponsiveModal';
import classes from './PlayerIntrapartidoSummaryModal.module.css';
import { getPendingIntrapartidoSummary, markIntrapartidoSummarySeen } from '@/actions/intrapartidoActions';

// Cuenta de 0 al valor final con ease-out; respeta prefers-reduced-motion.
function useCountUp(target, delay = 400, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return undefined;
    }
    let raf;
    const start = performance.now() + delay;
    const tick = (now) => {
      const t = Math.min(Math.max((now - start) / duration, 0), 1);
      setValue(target * (1 - (1 - t) ** 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, duration]);
  return value;
}

function StatCard({ index, label, target, unit, color, decimals = 0 }) {
  const value = useCountUp(target, 350 + index * 110);
  return (
    <Paper className={classes.item} style={{ '--i': index }} radius="lg" p="sm" bg="white" withBorder>
      <Text fz="10px" fw={700} tt="uppercase" c="dimmed">{label}</Text>
      <Group gap={4} align="baseline" wrap="nowrap">
        <Text fz={26} fw={800} c={color} lh={1.1} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value.toFixed(decimals)}
        </Text>
        <Text fz="xs" fw={600} c="dimmed">{unit}</Text>
      </Group>
    </Paper>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(new Date(`${dateStr}T00:00:00`));
}

/**
 * Aviso de una sola vez con el resumen del control intrapartido de un partido reciente.
 * Al cerrarlo (de cualquier forma) se marca como visto y no vuelve a salir; los datos
 * siguen en Métricas → Intrapartido.
 */
export default function PlayerIntrapartidoSummaryModal({ playerId }) {
  const router = useRouter();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPendingIntrapartidoSummary()
      .then((res) => {
        if (!cancelled) setSummary(res.summary);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!summary) return null;

  const close = (goToDetail = false) => {
    const { id } = summary;
    setSummary(null);
    markIntrapartidoSummarySeen(id).catch(() => {});
    if (goToDetail) router.push(`/dashboard/jugador/${playerId}/metricas/intrapartido`);
  };

  const { totals } = summary;

  return (
    <ResponsiveModal
      opened
      onClose={() => close(false)}
      size="sm"
      radius="xl"
      zIndex={2000}
      title={<Text fw={700} size="md">Tu partido</Text>}
    >
      <Stack gap="md">
        <Stack gap={4} align="center" ta="center">
          <Box className={classes.hero}><Icon3D name="soccer" size={64} /></Box>
          <Text fw={800} fz="lg" c="dark.6">{summary.rival ? `vs ${summary.rival}` : 'Control del partido'}</Text>
          <Group gap={6} justify="center">
            <Text fz="xs" c="dimmed">
              {[formatDate(summary.fecha), summary.competicion].filter(Boolean).join(' · ')}
            </Text>
            <Badge size="xs" variant="light" color={summary.titular ? 'green' : 'blue'}>
              {summary.titular ? 'Titular' : 'Suplente'}
            </Badge>
          </Group>
        </Stack>

        <SimpleGrid cols={2} spacing="xs">
          <StatCard index={0} label="Líquidos" target={totals.aguaMl} unit="ml" color="#0284c7" />
          <StatCard index={1} label="Carbohidratos" target={totals.carbsG} unit="g" color="#d97706" />
          <StatCard index={2} label="Sodio" target={totals.sodioMg} unit="mg" color="dark.6" />
          <StatCard index={3} label="Energía" target={totals.kcal} unit="kcal" color="dark.6" />
        </SimpleGrid>

        <Text className={classes.item} style={{ '--i': 4 }} fz="xs" c="dimmed" ta="center">
          {summary.momentos.length > 0
            ? `Tomas registradas en: ${summary.momentos.join(', ')}.`
            : 'No se registraron tomas en este partido.'}
          {' '}Podrás volver a verlo en Métricas → Intrapartido.
        </Text>

        <Group className={classes.item} style={{ '--i': 5 }} grow gap="xs">
          <Button variant="default" radius="xl" onClick={() => close(true)}>Ver detalle</Button>
          <Button color="lima" radius="xl" onClick={() => close(false)}>Entendido</Button>
        </Group>
      </Stack>
    </ResponsiveModal>
  );
}
