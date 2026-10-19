'use client';

import { useEffect, useMemo, useState } from 'react';
import { Stack, Select, Text, Paper, Group, Loader, Center, Button, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import ResponsiveModal from './ResponsiveModal';
import { listCopyablePautas } from '@/actions/playerActions';
import { formatAstToText } from '@/lib/engine/meal-ast';
import { errorMessage } from '@/lib/actionError';

/**
 * Elige una pauta ya interpretada (de este jugador o de otro) para copiarla a la toma que se está editando.
 * Al guardar, la pauta se ajusta a las intolerancias y aversiones del jugador de destino.
 */
export default function CopyPautaModal({ opened, onClose, jugadorId, mealName, onCopy }) {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [sourceId, setSourceId] = useState(null);

  useEffect(() => {
    if (!opened) return;
    let cancelled = false;
    setLoading(true);
    listCopyablePautas()
      .then((list) => {
        if (cancelled) return;
        setPlayers(list);
        const own = list.find((p) => String(p.id) === String(jugadorId));
        setSourceId((own || list[0])?.id ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        notifications.show({ color: 'red', title: 'Error al cargar pautas', message: errorMessage(err) });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [opened, jugadorId]);

  const source = useMemo(() => players.find((p) => p.id === sourceId), [players, sourceId]);

  function handleCopy(pauta) {
    onCopy(pauta);
    onClose();
  }

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={`Copiar pauta a ${mealName}`} size="lg" radius="md">
      {loading ? (
        <Center py="xl"><Loader size="sm" /></Center>
      ) : players.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          Aún no hay pautas interpretadas que copiar.
        </Text>
      ) : (
        <Stack gap="sm">
          <Select
            label="Jugador de origen"
            data={players.map((p) => ({
              value: p.id,
              label: `${p.nombre}${p.equipo ? ` · ${p.equipo}` : ''}${String(p.id) === String(jugadorId) ? ' (este jugador)' : ''}`,
            }))}
            value={sourceId}
            onChange={setSourceId}
            searchable
            allowDeselect={false}
            size="sm"
            comboboxProps={{ zIndex: 2500, withinPortal: true }}
          />
          <Stack gap="xs">
            {(source?.pautas || []).map((item, idx) => (
              <Paper key={`${item.horario || 'habitual'}-${item.toma}-${idx}`} p="xs" withBorder radius="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Group gap={6}>
                      <Text size="sm" fw={700}>{item.toma}</Text>
                      <Badge size="xs" variant="light" color="gray">{item.origen}</Badge>
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={3}>{formatAstToText(item.pauta)}</Text>
                  </Stack>
                  <Button size="compact-xs" radius="xl" variant="light" onClick={() => handleCopy(item.pauta)}>
                    Copiar
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
          {String(sourceId) !== String(jugadorId) && (
            <Text size="11px" c="dimmed">
              Al guardar, se quitan o sustituyen los alimentos que este jugador no pueda tomar.
            </Text>
          )}
        </Stack>
      )}
    </ResponsiveModal>
  );
}
