'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Box, Button, Group, Skeleton, Stack, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Icon3D from '@/components/Icon3D';
import { getTeamChallenge, setChallengeParticipation } from '@/actions/challengeActions';
import { CHALLENGE_CATEGORIES } from '@/config/challenges';
import { notifySaved } from '@/components/motion/notifySaved';
import { errorMessage } from '@/lib/actionError';
import WidgetCard, { WidgetAside } from './WidgetCard';

const BOSQUE = 'var(--nutra-bosque, #1F2A24)';
const SALVIA = 'var(--nutra-salvia, #6C705A)';
const MEDALS = ['first_place', 'medal', 'sports_medal'];
const VISIBLE_ROWS = 8;

function RankingRow({ row, position, maxPoints, isMe }) {
  const pct = maxPoints > 0 ? (row.points / maxPoints) * 100 : 0;
  return (
    <Group
      wrap="nowrap"
      gap="sm"
      px={10}
      py={6}
      style={{
        borderRadius: 14,
        backgroundColor: isMe ? 'var(--nutra-lima-glow, rgba(193, 240, 128, 0.22))' : 'var(--mantine-color-hueso-1)',
        border: isMe ? '1.5px solid var(--nutra-lima, #C1F080)' : '1.5px solid transparent',
      }}
    >
      <Box w={26} style={{ display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {position < 3 ? <Icon3D name={MEDALS[position]} size={22} /> : <Text fz="sm" fw={800} c={SALVIA}>{position + 1}</Text>}
      </Box>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Text fz="sm" fw={700} c={BOSQUE} truncate>{isMe ? `${row.name} (tú)` : row.name}</Text>
          <Text fz="sm" fw={800} c={BOSQUE} style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{row.points} pts</Text>
        </Group>
        <Box h={5} mt={5} style={{ borderRadius: 3, backgroundColor: 'var(--mantine-color-hueso-3)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: position * 0.05 }}
            style={{ height: '100%', borderRadius: 3, backgroundColor: isMe ? 'var(--mantine-color-lima-6)' : 'var(--mantine-color-bosque-6)' }}
          />
        </Box>
        <Group gap={8} mt={4}>
          {CHALLENGE_CATEGORIES.map((c) => (
            <Tooltip key={c.key} label={`${c.label}: ${row.breakdown[c.key]} días`} withArrow>
              <Group gap={3} wrap="nowrap">
                <Icon3D name={c.icon} size={12} />
                <Text fz={10} fw={700} c={SALVIA} style={{ fontVariantNumeric: 'tabular-nums' }}>{row.breakdown[c.key]}</Text>
              </Group>
            </Tooltip>
          ))}
        </Group>
      </Box>
    </Group>
  );
}

/**
 * Reto semanal de constancia del equipo (voluntario): puntos por días con el agua, los suplementos,
 * el diario y el bienestar al día. Nunca muestra peso ni medidas.
 */
export default function TeamChallengeWidget({ jugadorId, style }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    getTeamChallenge(jugadorId)
      .then((res) => { if (alive) setData(res); })
      .catch((error) => console.error('Error cargando el reto de equipo:', error))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [jugadorId, version]);

  const toggle = async (join) => {
    setSaving(true);
    try {
      await setChallengeParticipation(join);
      if (join) notifySaved({ title: '¡Estás dentro!', message: 'Suma puntos cada día con el agua, los suplementos, el diario y el bienestar.' });
      setVersion((n) => n + 1);
    } catch (error) {
      notifications.show({ color: 'red', title: 'No se pudo cambiar', message: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  if (!loading && !data) return null;
  // El staff solo ve el ranking si hay alguien apuntado
  if (!loading && !data.isPlayer && data.participants === 0) return null;

  const myIndex = data?.ranking.findIndex((r) => String(r.id) === String(jugadorId)) ?? -1;
  const rows = showAll ? data?.ranking || [] : (data?.ranking || []).slice(0, VISIBLE_ROWS);

  return (
    <WidgetCard
      id="widget-team-challenge"
      icon="trophy"
      title="Reto de equipo"
      color="lima"
      aside={data ? <WidgetAside color="salvia">{data.participants} {data.participants === 1 ? 'jugador' : 'jugadores'}</WidgetAside> : null}
      footer={data?.joined ? 'Solo se comparten puntos, nunca tu peso ni tus medidas.' : 'Voluntario · solo se comparten puntos de constancia'}
      footerAction={data?.isPlayer && data?.joined ? 'Salir del reto' : null}
      onFooterAction={data?.isPlayer && data?.joined ? () => toggle(false) : undefined}
      style={{ height: 'auto', ...style }}
    >
      {loading ? (
        <Stack gap="xs">{[0, 1, 2].map((i) => <Skeleton key={i} h={48} radius={14} />)}</Stack>
      ) : data.isPlayer && !data.joined ? (
        <Stack gap="sm">
          <Text fz="sm" c="dark.5" lh={1.45}>
            Compite esta semana con tus compañeros en constancia: cada día sumas un punto por el agua, los suplementos, el diario y el bienestar.
          </Text>
          <Group gap="xs">
            {CHALLENGE_CATEGORIES.map((c) => (
              <Group key={c.key} gap={4} wrap="nowrap" px={8} py={3} style={{ borderRadius: 20, backgroundColor: 'var(--mantine-color-hueso-1)' }}>
                <Icon3D name={c.icon} size={14} />
                <Text fz={11} fw={700} c={BOSQUE}>{c.label}</Text>
              </Group>
            ))}
          </Group>
          <Button radius="xl" color="lima" c={BOSQUE} w="fit-content" onClick={() => toggle(true)} loading={saving}>
            Unirme al reto
          </Button>
        </Stack>
      ) : (
        <Stack gap={6}>
          <Text fz="xs" c={SALVIA} mb={2}>
            Semana en curso · {data.week.daysElapsed}/7 días · máximo {data.maxPoints} pts
          </Text>
          {rows.map((row, index) => (
            <RankingRow key={row.id} row={row} position={index} maxPoints={data.maxPoints} isMe={index === myIndex} />
          ))}
          {!showAll && myIndex >= VISIBLE_ROWS && (
            <RankingRow row={data.ranking[myIndex]} position={myIndex} maxPoints={data.maxPoints} isMe />
          )}
          {data.ranking.length > VISIBLE_ROWS && (
            <Button variant="subtle" color="gray" size="xs" radius="xl" w="fit-content" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Ver menos' : `Ver los ${data.ranking.length}`}
            </Button>
          )}
        </Stack>
      )}
    </WidgetCard>
  );
}
