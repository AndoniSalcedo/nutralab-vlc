'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Collapse,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import SubtabHeader from '../SubtabHeader';
import classes from '../SubtabSectionHeader.module.css';
import PlayerSupplementModal from '@/components/modals/PlayerSupplementModal';
import { notifications } from '@mantine/notifications';
import { getPlayerSupplementation, postPlayerSupplementation } from '@/services/supplement';
import { updatePlayerField } from '@/services/player';
import Icon3D from '@/components/Icon3D';
import {
  IconAlertCircle,
  IconBottle,
  IconCirclePlus,
  IconTrash,
  IconChevronDown,
} from '@/components/icons3d';
import { EditableSection } from '../editable';
import { BentoCard } from '@/components/BentoItem';


function getSupplementIcon(suplemento) {
  if (suplemento?.icon) return suplemento.icon;
  const name = (suplemento?.nombre || '').toLowerCase();
  const cat = (suplemento?.categoria || '').toLowerCase();
  if (cat.includes('recuper') || name.includes('prote')) return 'gym';
  if (cat.includes('salud') || name.includes('omega') || name.includes('vitam')) return 'apple';
  if (cat.includes('rendim') || name.includes('creatin') || name.includes('cafe')) return 'bolt';
  if (cat.includes('descans') || name.includes('melaton')) return 'bed';
  if (cat.includes('inmuno')) return 'shield';
  if (cat.includes('articul') || name.includes('colagen')) return 'bone';
  return 'pill';
}

function byId(items) {
  return new Map((items || []).map((item) => [Number(item.id), item]));
}

function formatDose(suplemento, peso, override) {
  if (override) return { value: override, needsWeight: false };

  if (suplemento?.dose_type === 'per_kg_range') {
    if (!peso) {
      return { value: suplemento.dose_text || suplemento.pauta || 'Según peso', needsWeight: true };
    }

    const min = Math.round(Number(suplemento.dose_min || 0) * peso);
    const max = Math.round(Number(suplemento.dose_max || 0) * peso);
    const unit = suplemento.dose_unit || '';

    if (min === max) {
      return { value: `${min} ${unit}`.trim(), needsWeight: false };
    }
    return { value: `${min}-${max} ${unit}`.trim(), needsWeight: false };
  }

  return {
    value: suplemento?.dose_text || suplemento?.pauta || 'Según pauta',
    needsWeight: false,
  };
}

function SupplementCard({ item, peso, onDelete, readOnly }) {
  const suplemento = item.suplemento;
  const dose = formatDose(suplemento, peso, item.dose_override);
  const timing = item.timing_override || suplemento.timing || 'Según pauta';
  const note = item.note_override || suplemento.descripcion || suplemento.notas || '';

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      bg="gray.0"
      h="100%"
    >
      <Stack gap={8} h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={3}>
            <Group gap={6}>
              <Text size="sm" fw={600} c="dark.5">{suplemento.nombre}</Text>
              <Badge color={item.source === 'extra' ? 'grape' : 'nutralabColor'} variant="light" radius="xs" size="xs">
                {item.source === 'extra' ? 'Extra' : item.hasOverride ? 'Lista + ajuste' : 'Lista'}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">{suplemento.categoria || 'Suplemento'}</Text>
          </Stack>

          {!readOnly && item.extraId && (
            <ActionIcon variant="subtle" color="red" radius="xl" onClick={() => onDelete(item.extraId)} aria-label="Eliminar suplemento extra">
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Group>

        <Group gap="xs" align="center">
          <Icon3D name={getSupplementIcon(suplemento)} size={30} style={{ flexShrink: 0 }} />
          <Stack gap={0}>
            <Text size="lg" fw={700} c="dark.5">{dose.value}</Text>
            <Text size="xs" c="dimmed">{timing}</Text>
          </Stack>
        </Group>

        {dose.needsWeight && (
          <Badge color="orange" variant="light" radius="sm" w="fit-content">
            Falta peso para personalizar
          </Badge>
        )}

        {note && <Text size="xs" c="dimmed" lineClamp={3} mt="auto">{note}</Text>}
      </Stack>
    </Paper>
  );
}

function AssignedProtocol({ items, peso, onDelete, canManage }) {
  return (
    <BentoCard title="Protocolo asignado" icon={IconBottle} color="nutralabColor">
      {items.length ? (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm" suppressHydrationWarning>
          {items.map((item) => (
            <SupplementCard
              key={item.key}
              item={item}
              peso={peso}
              readOnly={!canManage}
              onDelete={onDelete}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Paper p="md" radius="md" withBorder bg="gray.0">
          <Group gap="sm" align="flex-start" wrap="nowrap">
            <Icon3D name="sparkles" size={24} style={{ flexShrink: 0 }} />
            <Stack gap={2}>
              <Text fw={600} c="dark.5">Sin suplementos asignados</Text>
              <Text size="sm" c="dimmed">
                Asigna un catálogo o añade suplementos extra para generar el protocolo.
              </Text>
            </Stack>
          </Group>
        </Paper>
      )}
    </BentoCard>
  );
}



function buildProtocol(jugador, lista, items, peso) {
  const title = `SUPLEMENTACION - ${jugador.nombre || ''} ${jugador.apellidos || ''}`.trim();
  const lines = [
    title,
    lista ? `Catálogo activo: ${lista.nombre}` : 'Catálogo activo: sin asignar',
    peso ? `Peso usado para dosis: ${peso} kg` : 'Peso usado para dosis: pendiente de registrar',
    '',
  ];

  if (!items.length) {
    lines.push('Sin suplementos asignados.');
    return lines.join('\n');
  }

  items.forEach((item) => {
    const suplemento = item.suplemento;
    const dose = formatDose(suplemento, peso, item.dose_override);
    lines.push(`- ${suplemento.nombre}: ${dose.value} · ${item.timing_override || suplemento.timing || 'Según pauta'}`);
    if (item.note_override || suplemento.notas) {
      lines.push(`  Nota: ${item.note_override || suplemento.notas}`);
    }
  });

  return lines.join('\n');
}

export default function SuplementacionSubtab({ jugador, readOnly = false }) {
  const isMobile = useMediaQuery('(max-width: 48em)', true);
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(false);
  const peso = Number(jugador.peso_kg || 0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState('lista');
  const [data, setData] = useState({
    suplementos: [],
    listas: [],
    items: [],
    asignacion: null,
    extras: [],
    canManage: false,
  });
  const [extraForm, setExtraForm] = useState({
    suplemento_id: '',
    dose_override: '',
    timing_override: '',
    note_override: '',
  });

  const supplementMap = useMemo(() => byId(data.suplementos), [data.suplementos]);
  const listMap = useMemo(() => byId(data.listas), [data.listas]);
  const activeList = data.asignacion?.lista_id ? listMap.get(Number(data.asignacion.lista_id)) : null;

  const assignedItems = useMemo(() => {
    const activeListId = Number(data.asignacion?.lista_id || 0);
    const extrasBySupplement = new Map((data.extras || []).map((extra) => [Number(extra.suplemento_id), extra]));
    const used = new Set();

    const base = (data.items || [])
      .filter((item) => Number(item.lista_id) === activeListId)
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
      .map((item) => {
        const suplemento = supplementMap.get(Number(item.suplemento_id));
        if (!suplemento) return null;
        const extra = extrasBySupplement.get(Number(item.suplemento_id));
        used.add(Number(item.suplemento_id));
        return {
          key: `list-${item.id}`,
          source: 'list',
          suplemento,
          extraId: extra?.id,
          hasOverride: Boolean(extra?.dose_override || extra?.timing_override || extra?.note_override),
          dose_override: extra?.dose_override,
          timing_override: extra?.timing_override,
          note_override: extra?.note_override,
        };
      })
      .filter(Boolean);

    const extras = (data.extras || [])
      .filter((extra) => !used.has(Number(extra.suplemento_id)))
      .map((extra) => {
        const suplemento = supplementMap.get(Number(extra.suplemento_id));
        if (!suplemento) return null;
        return {
          key: `extra-${extra.id}`,
          source: 'extra',
          suplemento,
          extraId: extra.id,
          hasOverride: true,
          dose_override: extra.dose_override,
          timing_override: extra.timing_override,
          note_override: extra.note_override,
        };
      })
      .filter(Boolean);

    return [...base, ...extras];
  }, [data.asignacion?.lista_id, data.extras, data.items, supplementMap]);

  const protocolText = useMemo(
    () => buildProtocol(jugador, activeList, assignedItems, peso),
    [activeList, assignedItems, jugador, peso]
  );

  const canManage = !readOnly && data.canManage;

  function closeModal() {
    setModalOpened(false);
    setExtraForm({ suplemento_id: '', dose_override: '', timing_override: '', note_override: '' });
  }

  async function loadData() {
    setLoading(true);
    try {
      const nextData = await getPlayerSupplementation(jugador.id);
      setData(nextData);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'No se pudo cargar suplementación',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jugador.id]);

  async function saveField(field, value) {
    await updatePlayerField(jugador.id, field, value);
  }

  async function postSupplementation(payload, successMessage) {
    setSaving(true);
    try {
      await postPlayerSupplementation(jugador.id, payload);
      notifications.show({ color: 'green', title: 'Suplementación actualizada', message: successMessage });
      await loadData();
      return true;
    } catch (err) {
      notifications.show({ color: 'red', title: 'No se pudo guardar', message: err.message });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleListChange(value) {
    const ok = await postSupplementation(
      { action: 'set_list', lista_id: value ? Number(value) : null },
      'El catálogo se ha asignado correctamente.'
    );
    if (ok) closeModal();
  }

  async function handleAddExtra() {
    if (!extraForm.suplemento_id) {
      notifications.show({
        color: 'orange',
        title: 'Selecciona un suplemento',
        message: 'Elige un suplemento del catálogo antes de añadirlo.',
      });
      return;
    }

    const ok = await postSupplementation(
      {
        action: 'add_extra',
        suplemento_id: Number(extraForm.suplemento_id),
        dose_override: extraForm.dose_override,
        timing_override: extraForm.timing_override,
        note_override: extraForm.note_override,
      },
      'El suplemento extra se ha añadido al jugador.'
    );
    if (ok) closeModal();
  }

  async function handleDeleteExtra(extraId) {
    await postSupplementation(
      { action: 'delete_extra', extra_id: extraId },
      'El suplemento extra se ha eliminado.'
    );
  }

  const modalTitle = modalMode === 'lista' ? 'Añadir catálogo' : 'Añadir suplemento';
  const listSupplementCount = assignedItems.filter((item) => item.source === 'list').length;

  return (
    <Stack gap={0}>
      <PlayerSupplementModal
        opened={modalOpened && canManage}
        onClose={closeModal}
        modalMode={modalMode}
        setModalMode={setModalMode}
        modalTitle={modalTitle}
        data={data}
        handleListChange={handleListChange}
        saving={saving}
        extraForm={extraForm}
        setExtraForm={setExtraForm}
        handleAddExtra={handleAddExtra}
      />

      <Paper className={classes.mobileSticky} p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
            <Group gap="xs" style={{ flex: 1 }}>
              <SubtabHeader tab="nutricion" subtab="suplementacion" />
            </Group>

            {canManage && !isMobile && (
              <Button
                radius="xl"
                size="xs"
                leftSection={<IconCirclePlus size={15} />}
                onClick={() => setModalOpened(true)}
              >
                Añadir
              </Button>
            )}

            {isMobile && (
              <ActionIcon variant="light" color="gray" onClick={toggleExpanded} size="lg" radius="md">
                <IconChevronDown size={20} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '200ms' }} />
              </ActionIcon>
            )}
          </Group>

          <Collapse in={!isMobile || expanded} transitionDuration={isMobile ? 200 : 0}>
            <Stack gap="sm">
              {canManage && isMobile && (
                <Button
                  radius="xl"
                  size="xs"
                  leftSection={<IconCirclePlus size={15} />}
                  onClick={() => setModalOpened(true)}
                  fullWidth
                >
                  Añadir
                </Button>
              )}

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={6}>
                <Paper py={6} px="xs" radius="md" bg="gray.0" withBorder>
                  <Group gap="xs" wrap="nowrap">
                    <Icon3D name="card_file_box" size={20} style={{ flexShrink: 0 }} />
                    <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
                      <Text size="xs" c="dimmed" fw={600}>Catálogo</Text>
                      <Text size="sm" fw={700} c="dark.5" truncate>{activeList ? activeList.nombre : 'Sin asignar'}</Text>
                      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{activeList ? `(${listSupplementCount})` : ''}</Text>
                    </Group>
                  </Group>
                </Paper>

                <Paper py={6} px="xs" radius="md" bg="gray.0" withBorder>
                  <Group gap="xs" wrap="nowrap">
                    <Icon3D name="plus" size={20} style={{ flexShrink: 0 }} />
                    <Group gap={4} wrap="nowrap">
                      <Text size="xs" c="dimmed" fw={600}>Extras</Text>
                      <Text size="sm" fw={700} c="dark.5">{data.extras.length}</Text>
                    </Group>
                  </Group>
                </Paper>

                <Paper py={6} px="xs" radius="md" bg="gray.0" withBorder>
                  <Group gap="xs" wrap="nowrap">
                    <Icon3D name="scale" size={20} style={{ flexShrink: 0 }} />
                    <Group gap={4} wrap="nowrap">
                      <Text size="xs" c="dimmed" fw={600}>Peso</Text>
                      <Text size="sm" fw={700} c="dark.5">{peso ? `${peso} kg` : 'Pendiente'}</Text>
                    </Group>
                  </Group>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }} pos="relative">
        <LoadingOverlay visible={loading} />
        <Stack gap="md">
          {!peso && (
            <Alert color="orange" variant="light" icon={<IconAlertCircle size={18} />} radius="md">
              Los suplementos con dosis por kg mostrarán la fórmula base hasta registrar el peso del jugador.
            </Alert>
          )}

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" verticalSpacing="md" style={{ alignItems: 'start' }} suppressHydrationWarning>
            <AssignedProtocol
              items={assignedItems}
              peso={peso}
              canManage={canManage}
              onDelete={handleDeleteExtra}
            />
            <EditableSection
              key={jugador.notas_suplementacion || protocolText}
              title="Notas libres de suplementación"
              defaultValue={jugador.notas_suplementacion || protocolText}
              onSave={(value) => saveField('notas_suplementacion', value)}
              readOnly={readOnly}
            />
          </SimpleGrid>
        </Stack>
      </Box>
    </Stack>
  );
}
