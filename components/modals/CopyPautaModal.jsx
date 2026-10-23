'use client';

import { useEffect, useMemo, useState } from 'react';
import { Stack, Text, Paper, Group, Button, Checkbox, MultiSelect, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import ResponsiveModal from './ResponsiveModal';
import { IconCheck, IconX } from '@/components/icons3d';
import { copyPautas, listPautaCopyTargets } from '@/actions/playerActions';
import { formatAstToText } from '@/lib/engine/meal-ast';
import { isDefaultProtocolMeal } from '@/lib/nutrition/prematch-protocol';
import { notifySaved } from '@/components/motion/notifySaved';
import { errorMessage } from '@/lib/actionError';

const COMBOBOX_PROPS = { zIndex: 2500, withinPortal: true };
const EMPTY_PAUTAS = {};

const SLOTS = [
  { value: 'habitual', label: 'Comidas habituales' },
  { value: 'manana', label: 'Partido mañana' },
  { value: 'tarde', label: 'Partido tarde' },
  { value: 'noche', label: 'Partido noche' },
];
const slotLabel = (slot) => SLOTS.find((s) => s.value === slot)?.label || slot;

/** Tomas que se pueden copiar: las habituales escritas y las tomas manuales del protocolo. */
export function getCopyablePautas(patterns, slot) {
  return Object.fromEntries(Object.entries(patterns || {}).filter(([, pauta]) => (
    slot === 'habitual'
      ? Boolean(pauta?.type && pauta.type !== 'complete' && pauta.tree)
      : Boolean(pauta?.type && !isDefaultProtocolMeal(pauta))
  )));
}

function describePauta(pauta) {
  if (pauta?.type === 'complete') return 'Rotación variada';
  return formatAstToText(pauta) || 'Sin pauta definida';
}

/**
 * Copia las pautas ya escritas de un hueco del jugador (comidas habituales o el protocolo de un horario de partido)
 * a otros huecos del mismo jugador y/o de otros jugadores. Se guarda al momento; en cada destino las tomas
 * copiadas sustituyen a las que hubiera y se ajustan a sus intolerancias y aversiones.
 */
export default function CopyPautaModal({ opened, onClose, jugadorId, sourceSlot, pautas = EMPTY_PAUTAS, onCopied }) {
  // Clave estable: el padre puede pasar un objeto nuevo en cada render y no debe reiniciar la selección.
  const tomasKey = Object.keys(pautas).join('|');
  const tomas = useMemo(() => (tomasKey ? tomasKey.split('|') : []), [tomasKey]);
  const [selectedTomas, setSelectedTomas] = useState([]);
  const [ownSlots, setOwnSlots] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerIds, setPlayerIds] = useState([]);
  const [playerSlots, setPlayerSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setSelectedTomas(tomas);
    setOwnSlots(sourceSlot === 'habitual' ? [] : SLOTS.filter((s) => s.value !== sourceSlot && s.value !== 'habitual').map((s) => s.value));
    setPlayerIds([]);
    setPlayerSlots([sourceSlot]);
  }, [opened, tomas, sourceSlot]);

  useEffect(() => {
    if (!opened) return;
    let cancelled = false;
    listPautaCopyTargets()
      .then((list) => {
        if (!cancelled) setPlayers(list.filter((p) => String(p.id) !== String(jugadorId)));
      })
      .catch((err) => {
        if (cancelled) return;
        notifications.show({ color: 'red', title: 'Error al cargar jugadores', message: errorMessage(err) });
      });
    return () => { cancelled = true; };
  }, [opened, jugadorId]);

  // Jugadores agrupados por equipo para el selector
  const playerOptions = useMemo(() => {
    const groups = new Map();
    for (const player of players) {
      const group = player.equipo || 'Sin equipo';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push({ value: String(player.id), label: player.nombre });
    }
    return [...groups].map(([group, items]) => ({ group, items }));
  }, [players]);

  const destinos = [
    ...(ownSlots.length > 0 ? [{ jugadorId, slots: ownSlots }] : []),
    ...(playerSlots.length > 0 ? playerIds.map((id) => ({ jugadorId: id, slots: playerSlots })) : []),
  ];
  const destinoCount = destinos.reduce((sum, d) => sum + d.slots.length, 0);

  async function handleCopy() {
    setSaving(true);
    try {
      const res = await copyPautas({ sourceJugadorId: jugadorId, sourceSlot, tomas: selectedTomas, destinos });
      if (!res?.ok) throw new Error(res?.error || 'No se pudieron copiar las pautas.');
      notifySaved({
        color: 'teal',
        title: 'Pautas copiadas',
        message: `${selectedTomas.join(', ')} → ${destinoCount} ${destinoCount === 1 ? 'destino' : 'destinos'}.`,
      });
      const avisos = [...(res.omitidas || []).map((o) => `No copiada: ${o}`), ...(res.ajustes || [])];
      if (avisos.length > 0) {
        notifications.show({ color: 'orange', title: 'Revisa la copia', message: <Stack gap={2}>{avisos.map((aviso) => <Text key={aviso} size="xs">{aviso}</Text>)}</Stack>, autoClose: 10000 });
      }
      onCopied?.();
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error al copiar', message: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={`Copiar pautas · ${slotLabel(sourceSlot)}`} size="lg" radius="md" zIndex={300}>
      {tomas.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No hay pautas escritas a mano en {slotLabel(sourceSlot).toLowerCase()} para copiar.
        </Text>
      ) : (
        <Stack gap="md">
          <Checkbox.Group label="Tomas a copiar" value={selectedTomas} onChange={setSelectedTomas}>
            <Stack gap={6} mt={6}>
              {tomas.map((toma) => (
                <Paper key={toma} p="xs" withBorder radius="md" bg={selectedTomas.includes(toma) ? 'blue.0' : undefined}>
                  <Checkbox
                    value={toma}
                    size="xs"
                    label={<Text size="sm" fw={700}>{toma}</Text>}
                    description={<Text size="xs" c="dark.7" style={{ overflowWrap: 'anywhere' }}>{describePauta(pautas[toma])}</Text>}
                  />
                </Paper>
              ))}
            </Stack>
          </Checkbox.Group>

          <Divider />

          <Checkbox.Group label="En este jugador" value={ownSlots} onChange={setOwnSlots}>
            <Group gap="md" mt={6}>
              {SLOTS.filter((s) => s.value !== sourceSlot).map((s) => (
                <Checkbox key={s.value} value={s.value} label={s.label} size="xs" />
              ))}
            </Group>
          </Checkbox.Group>

          <Stack gap={6}>
            <MultiSelect
              label="En otros jugadores"
              placeholder={playerIds.length === 0 ? 'Elegir jugadores (opcional)' : undefined}
              data={playerOptions}
              value={playerIds}
              onChange={setPlayerIds}
              searchable
              clearable
              size="sm"
              comboboxProps={COMBOBOX_PROPS}
            />
            {playerIds.length > 0 && (
              <Checkbox.Group value={playerSlots} onChange={setPlayerSlots}>
                <Group gap="md">
                  {SLOTS.map((s) => (
                    <Checkbox key={s.value} value={s.value} label={s.label} size="xs" />
                  ))}
                </Group>
              </Checkbox.Group>
            )}
          </Stack>

          <Text size="11px" c="dimmed">
            Las tomas copiadas sustituyen a las del destino y se guardan al momento. En un protocolo de partido pasan a
            ser manuales; en comidas habituales solo se copian las tomas que el jugador tiene. Se quitan o sustituyen
            los alimentos que cada jugador no pueda tomar.
          </Text>

          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={onClose} disabled={saving} leftSection={<IconX size={14} />}>
              Cancelar
            </Button>
            <Button
              variant="filled"
              color="dark"
              size="xs"
              radius="xl"
              onClick={handleCopy}
              loading={saving}
              disabled={selectedTomas.length === 0 || destinoCount === 0}
              leftSection={<IconCheck size={14} />}
            >
              Copiar{destinoCount > 0 ? ` (${destinoCount} ${destinoCount === 1 ? 'destino' : 'destinos'})` : ''}
            </Button>
          </Group>
        </Stack>
      )}
    </ResponsiveModal>
  );
}
