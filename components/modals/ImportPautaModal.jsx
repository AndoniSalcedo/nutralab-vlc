'use client';

import { useEffect, useMemo, useState } from 'react';
import { Stack, Select, Text, Paper, Group, Loader, Center, Button, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import ResponsiveModal from './ResponsiveModal';
import { IconCheck, IconX } from '@/components/icons3d';
import { listCopyablePautas } from '@/actions/playerActions';
import { formatAstToText } from '@/lib/engine/meal-ast';
import { errorMessage } from '@/lib/actionError';

const normalize = (value) => String(value || '').trim().toLowerCase();
const COMBOBOX_PROPS = { zIndex: 2500, withinPortal: true };

/**
 * Importa pautas ya interpretadas de otros jugadores para varias tomas del día a la vez
 * (p. ej. comida y cena de un jugador y merienda de otro). Cada toma solo se puede importar
 * de la misma toma del jugador de origen. Al guardar, las pautas se ajustan a las intolerancias
 * y aversiones del jugador de destino.
 *
 * `preferHorario` decide qué pauta se toma al importar «todo» de un jugador: la del mismo
 * protocolo de partido si existe; si no, la habitual (null = primero la habitual).
 */
export default function ImportPautaModal({ opened, onClose, jugadorId, tomas = [], preferHorario = null, onImport }) {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  // { [toma]: 'playerId|idx' }
  const [selection, setSelection] = useState({});

  useEffect(() => {
    if (!opened) return;
    let cancelled = false;
    setLoading(true);
    setSelection({});
    listCopyablePautas()
      .then((list) => {
        if (!cancelled) setPlayers(list.filter((p) => String(p.id) !== String(jugadorId)));
      })
      .catch((err) => {
        if (cancelled) return;
        notifications.show({ color: 'red', title: 'Error al cargar pautas', message: errorMessage(err) });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [opened, jugadorId]);

  // Para cada toma, las pautas de esa misma toma en otros jugadores, agrupadas por equipo
  const optionsByToma = useMemo(() => {
    const result = {};
    for (const toma of tomas) {
      const groups = new Map();
      for (const player of players) {
        player.pautas.forEach((item, idx) => {
          if (normalize(item.toma) !== normalize(toma)) return;
          const group = player.equipo || 'Sin equipo';
          if (!groups.has(group)) groups.set(group, []);
          groups.get(group).push({ value: `${player.id}|${idx}`, label: `${player.nombre} · ${item.origen}` });
        });
      }
      result[toma] = [...groups].map(([group, items]) => ({ group, items }));
    }
    return result;
  }, [players, tomas]);

  const playersWithMatches = useMemo(
    () => players.filter((p) => p.pautas.some((item) => tomas.some((t) => normalize(t) === normalize(item.toma)))),
    [players, tomas]
  );

  const findPauta = (value) => {
    if (!value) return null;
    const [playerId, idx] = value.split('|');
    return players.find((p) => String(p.id) === playerId)?.pautas[Number(idx)] || null;
  };

  // Rellena todas las tomas que tenga el jugador elegido
  function applyPlayerToAll(playerId) {
    const player = players.find((p) => String(p.id) === String(playerId));
    if (!player) return;
    setSelection((prev) => {
      const next = { ...prev };
      for (const toma of tomas) {
        const matches = player.pautas
          .map((item, idx) => ({ item, idx }))
          .filter(({ item }) => normalize(item.toma) === normalize(toma));
        if (matches.length === 0) continue;
        const preferred =
          matches.find(({ item }) => (item.horario || null) === preferHorario) ||
          matches.find(({ item }) => !item.horario) ||
          matches[0];
        next[toma] = `${player.id}|${preferred.idx}`;
      }
      return next;
    });
  }

  const selectedTomas = tomas.filter((toma) => selection[toma]);

  function handleImport() {
    const imported = {};
    for (const toma of selectedTomas) {
      const item = findPauta(selection[toma]);
      if (item) imported[toma] = item.pauta;
    }
    onImport(imported);
    onClose();
  }

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title="Importar pautas de otros jugadores" size="lg" radius="md" zIndex={300}>
      {loading ? (
        <Center py="xl"><Loader size="sm" /></Center>
      ) : playersWithMatches.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          Ningún otro jugador tiene pautas escritas para estas tomas.
        </Text>
      ) : (
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Elige de qué jugador importar cada toma. Las que dejes sin elegir no cambian.
          </Text>

          <Select
            label="Importar todo de un jugador"
            placeholder="Elegir jugador (opcional)"
            data={playersWithMatches.map((p) => ({ value: String(p.id), label: `${p.nombre}${p.equipo ? ` · ${p.equipo}` : ''}` }))}
            value={null}
            onChange={applyPlayerToAll}
            searchable
            size="sm"
            comboboxProps={COMBOBOX_PROPS}
          />

          <Divider />

          <Stack gap="xs">
            {tomas.map((toma) => {
              const options = optionsByToma[toma] || [];
              const item = findPauta(selection[toma]);
              return (
                <Paper key={toma} p="sm" withBorder radius="md" bg={item ? 'blue.0' : undefined}>
                  <Stack gap={6}>
                    <Text size="sm" fw={700}>{toma}</Text>
                    <Select
                      placeholder={options.length > 0 ? 'No importar' : 'Ningún jugador tiene esta toma'}
                      data={options}
                      value={selection[toma] || null}
                      onChange={(value) => setSelection((prev) => ({ ...prev, [toma]: value }))}
                      disabled={options.length === 0}
                      clearable
                      searchable
                      size="xs"
                      comboboxProps={COMBOBOX_PROPS}
                    />
                    {item && (
                      <Text size="xs" c="dark.7" style={{ overflowWrap: 'anywhere' }}>
                        {formatAstToText(item.pauta)}
                      </Text>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <Text size="11px" c="dimmed">
            Al guardar, se quitan o sustituyen los alimentos que este jugador no pueda tomar.
          </Text>

          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={onClose} leftSection={<IconX size={14} />}>
              Cancelar
            </Button>
            <Button
              variant="filled"
              color="dark"
              size="xs"
              radius="xl"
              onClick={handleImport}
              disabled={selectedTomas.length === 0}
              leftSection={<IconCheck size={14} />}
            >
              Importar{selectedTomas.length > 0 ? ` (${selectedTomas.length})` : ''}
            </Button>
          </Group>
        </Stack>
      )}
    </ResponsiveModal>
  );
}
