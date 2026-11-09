'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Progress,
  ScrollArea,
  Select,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconArrowRight, IconCheck, IconPlayerSkipForward } from '@tabler/icons-react';
import Icon3D from '@/components/Icon3D';
import MeasurementFields from '@/components/measurements/MeasurementFields';
import { getTeamEvolutions, saveEvolution } from '@/actions/evolutionActions';
import {
  buildMeasurementPayload,
  emptyMeasurementForm,
  fillEmptyFromPrevious,
  formFromMeasurement,
  previousMeasurement,
} from '@/lib/metrics/measurements';
import { todayKey } from '@/lib/dates';
import { initials, getPlayerAvatarUrl } from '@/lib/utils';
import { errorMessage } from '@/lib/actionError';
import { notifySaved } from '@/components/motion/notifySaved';
import ResponsiveModal from './ResponsiveModal';

const BOSQUE = 'var(--nutra-bosque, #1F2A24)';
const SALVIA = 'var(--nutra-salvia, #6C705A)';

function dateValue(value) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function dateInputToIso(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const fullName = (p) => `${p?.nombre || ''} ${p?.apellidos || ''}`.trim();

const STATUS_LABEL = { saved: 'Guardada', skipped: 'Omitido' };

/**
 * Registro de mediciones de la plantilla jugador a jugador: para cada uno se ve su medición anterior
 * (y se puede copiar), se guarda y se pasa al siguiente, o se omite si ese día no se mide.
 * Cada medición se guarda al momento; cerrar a medias no pierde lo ya guardado.
 */
export default function SquadMeasurementModal({ opened, onClose, players = [], team }) {
  const router = useRouter();
  const [fecha, setFecha] = useState(todayKey());
  const [evoluciones, setEvoluciones] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState({});
  const [form, setForm] = useState(() => emptyMeasurementForm(todayKey()));
  const [saving, setSaving] = useState(false);
  const savedAny = useRef(false);

  // Al abrir se cargan las mediciones completas de la plantilla (la lista del equipo solo trae el resumen)
  useEffect(() => {
    if (!opened || !team?.id) return undefined;
    let active = true;
    setEvoluciones(null);
    setLoadError(null);
    setIndex(0);
    setStatus({});
    savedAny.current = false;
    getTeamEvolutions(team.id)
      .then((rows) => { if (active) setEvoluciones(rows || []); })
      .catch((err) => { if (active) setLoadError(errorMessage(err)); });
    return () => { active = false; };
  }, [opened, team?.id]);

  const byPlayer = useMemo(() => {
    const map = new Map();
    (evoluciones || []).forEach((e) => {
      const key = String(e.jugador_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return map;
  }, [evoluciones]);

  const done = index >= players.length;
  const player = done ? null : players[index];
  const playerEvoluciones = player ? byPlayer.get(String(player.id)) || [] : [];
  const existing = playerEvoluciones.find((e) => String(e.fecha) === fecha) || null;
  const previous = player ? previousMeasurement(playerEvoluciones, fecha, existing?.id) : null;

  // Formulario del jugador actual: su medición de ese día si ya existe, o vacío
  const formKey = `${player?.id}|${fecha}|${evoluciones ? 'ok' : 'loading'}`;
  useEffect(() => {
    setForm(existing ? formFromMeasurement(existing, fecha) : emptyMeasurementForm(fecha));
    // Solo al cambiar de jugador, de fecha o al terminar de cargar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

  const counts = useMemo(() => {
    const values = Object.values(status);
    return { saved: values.filter((v) => v === 'saved').length, skipped: values.filter((v) => v === 'skipped').length };
  }, [status]);
  const total = players.length || 1;

  const goTo = (i) => setIndex(Math.max(0, Math.min(players.length, i)));
  const next = () => goTo(index + 1);

  function updateFormField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function changeFecha(value) {
    const iso = dateInputToIso(value);
    if (!iso || iso === fecha) return;
    setFecha(iso);
    // El progreso es de un día: con otra fecha se empieza de nuevo
    setStatus({});
    setIndex(0);
  }

  function skip() {
    if (!player) return;
    setStatus((s) => ({ ...s, [player.id]: s[player.id] === 'saved' ? 'saved' : 'skipped' }));
    next();
  }

  async function saveAndNext() {
    if (!player || saving) return;
    setSaving(true);
    try {
      const payload = { ...buildMeasurementPayload({ ...form, fecha }), jugador_id: player.id };
      const { evolucion } = await saveEvolution(payload);
      setEvoluciones((rows) => [
        ...(rows || []).filter((e) => !(String(e.jugador_id) === String(player.id) && String(e.fecha) === String(evolucion.fecha))),
        evolucion,
      ]);
      setStatus((s) => ({ ...s, [player.id]: 'saved' }));
      savedAny.current = true;
      next();
    } catch (err) {
      notifications.show({ color: 'red', title: `No se pudo guardar la medición de ${fullName(player)}`, message: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (savedAny.current) {
      notifySaved({ title: 'Mediciones guardadas', message: `${counts.saved} ${counts.saved === 1 ? 'jugador medido' : 'jugadores medidos'}.` });
      router.refresh();
    }
    onClose?.();
  }

  const playerOptions = players.map((p, i) => ({
    value: String(i),
    label: `${fullName(p)}${status[p.id] ? ` · ${STATUS_LABEL[status[p.id]]}` : ''}`,
  }));
  const skippedPlayers = players.map((p, i) => ({ p, i })).filter(({ p }) => status[p.id] === 'skipped');

  return (
    <ResponsiveModal
      closeOnClickOutside={false}
      opened={opened}
      onClose={handleClose}
      size="lg"
      title={
        <Group gap="xs">
          <Icon3D name="ruler" size={26} />
          <Text fw={700}>Registrar mediciones</Text>
        </Group>
      }
    >
      <Stack gap="md">
        {/* Día de la medición y progreso de la plantilla */}
        <Group justify="space-between" align="flex-end" gap="sm" wrap="wrap">
          <DateInput
            label="Fecha de medición"
            value={dateValue(fecha)}
            onChange={changeFecha}
            valueFormat="DD/MM/YYYY"
            leftSection={<Icon3D name="calendar" size={18} />}
            w={{ base: '100%', xs: 200 }}
            disabled={saving}
          />
          <Box style={{ flex: 1, minWidth: 180 }}>
            <Group justify="space-between" mb={6} gap="xs">
              <Text fz="xs" fw={700} c={BOSQUE}>
                {counts.saved} guardadas · {counts.skipped} omitidas
              </Text>
              <Text fz="xs" fw={600} c={SALVIA}>
                {players.length} jugadores
              </Text>
            </Group>
            <Progress.Root size={8} radius="xl">
              <Progress.Section value={(counts.saved / total) * 100} color="lima.5" />
              <Progress.Section value={(counts.skipped / total) * 100} color="gray.4" />
            </Progress.Root>
          </Box>
        </Group>

        {loadError ? (
          <Text c="red" fz="sm">{loadError}</Text>
        ) : evoluciones === null ? (
          <Group justify="center" py="xl"><Loader color="bosque" size="sm" /><Text fz="sm" c="dimmed">Cargando mediciones…</Text></Group>
        ) : players.length === 0 ? (
          <Text fz="sm" c="dimmed" ta="center" py="xl">Este equipo no tiene jugadores.</Text>
        ) : done ? (
          // Resumen al terminar la plantilla
          <Stack gap="md" align="center" py="lg" ta="center">
            <Icon3D name="check" size={56} />
            <Box>
              <Text fw={800} fz="lg" c={BOSQUE}>Plantilla recorrida</Text>
              <Text fz="sm" c={SALVIA} mt={4}>
                {counts.saved} {counts.saved === 1 ? 'medición guardada' : 'mediciones guardadas'} · {counts.skipped} {counts.skipped === 1 ? 'jugador omitido' : 'jugadores omitidos'}
              </Text>
            </Box>
            {skippedPlayers.length > 0 && (
              <Stack gap={6} w="100%" maw={420}>
                <Text fz="xs" fw={700} c={SALVIA} tt="uppercase" lts={0.5} ta="left">Omitidos</Text>
                {skippedPlayers.map(({ p, i }) => (
                  <UnstyledButton
                    key={p.id}
                    onClick={() => goTo(i)}
                    px="sm"
                    py={8}
                    style={{ borderRadius: 12, backgroundColor: 'var(--mantine-color-hueso-1)' }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <Avatar src={getPlayerAvatarUrl(p)} size={28} radius="xl" color="initials">{initials(fullName(p))}</Avatar>
                        <Text fz="sm" fw={600} c={BOSQUE}>{fullName(p)}</Text>
                      </Group>
                      <Text fz="xs" fw={700} c={BOSQUE}>Medir →</Text>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            )}
            <Group>
              <Button variant="subtle" color="gray" radius="xl" onClick={() => goTo(players.length - 1)}>Volver al último</Button>
              <Button radius="xl" color="bosque" onClick={handleClose}>Terminar</Button>
            </Group>
          </Stack>
        ) : (
          <>
            {/* Jugador actual y acceso directo a cualquiera de la lista */}
            <Group justify="space-between" wrap="wrap" gap="sm" p="sm" style={{ borderRadius: 16, backgroundColor: 'var(--mantine-color-hueso-1)' }}>
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <Avatar src={getPlayerAvatarUrl(player)} size={44} radius="xl" color="initials">{initials(fullName(player))}</Avatar>
                <Box style={{ minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap">
                    <Text fw={800} c={BOSQUE} truncate>{fullName(player)}</Text>
                    {status[player.id] === 'saved' && <Badge size="xs" color="lima" c={BOSQUE} variant="filled">Guardada</Badge>}
                    {status[player.id] === 'skipped' && <Badge size="xs" color="gray" variant="light">Omitido</Badge>}
                    {!status[player.id] && existing && <Badge size="xs" color="bosque" variant="light">Ya medido este día</Badge>}
                  </Group>
                  <Text fz="xs" c={SALVIA}>
                    Jugador {index + 1} de {players.length}{player.posicion ? ` · ${player.posicion}` : ''}
                  </Text>
                </Box>
              </Group>
              <Select
                aria-label="Ir a jugador"
                placeholder="Ir a jugador"
                data={playerOptions}
                value={String(index)}
                onChange={(v) => v !== null && goTo(Number(v))}
                searchable
                size="xs"
                radius="xl"
                w={{ base: '100%', xs: 220 }}
                comboboxProps={{ zIndex: 2600 }}
                allowDeselect={false}
              />
            </Group>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${player.id}-${fecha}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <ScrollArea.Autosize mah={{ base: 'calc(100dvh - 380px)', sm: '48vh' }} offsetScrollbars>
                  <Box pr="xs">
                    <MeasurementFields
                      form={form}
                      updateFormField={updateFormField}
                      previous={previous}
                      onFillFromPrevious={() => setForm((current) => fillEmptyFromPrevious(current, previous))}
                      disabled={saving}
                    />
                  </Box>
                </ScrollArea.Autosize>
              </motion.div>
            </AnimatePresence>

            {/* Acciones: siempre a mano al final */}
            <Group justify="space-between" gap="xs" wrap="nowrap" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
              <ActionIcon
                variant="light"
                color="gray"
                radius="xl"
                size={36}
                onClick={() => goTo(index - 1)}
                disabled={index === 0 || saving}
                aria-label="Jugador anterior"
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
              <Group gap="xs" wrap="nowrap">
                <Button
                  variant="light"
                  color="gray"
                  radius="xl"
                  size="sm"
                  leftSection={<IconPlayerSkipForward size={16} />}
                  onClick={skip}
                  disabled={saving}
                >
                  Omitir
                </Button>
                <Button
                  radius="xl"
                  size="sm"
                  color="lima"
                  c={BOSQUE}
                  leftSection={<IconCheck size={16} />}
                  rightSection={<IconArrowRight size={16} />}
                  onClick={saveAndNext}
                  loading={saving}
                >
                  Guardar
                </Button>
              </Group>
            </Group>
          </>
        )}
      </Stack>
    </ResponsiveModal>
  );
}
