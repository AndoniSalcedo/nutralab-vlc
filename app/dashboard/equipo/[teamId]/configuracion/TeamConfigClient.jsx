'use client';

import { useState } from 'react';
import { slugify } from '@/lib/utils';
import { Button, Group, Stack, TextInput, NumberInput, Accordion, Paper, Title, ActionIcon, Table, Text, ThemeIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconDeviceFloppy, IconPencil, IconCalendarStats, IconSettings } from '@tabler/icons-react';
import { NUTRITION_DAY_TYPES, OBJECTIVE_DAY_TYPE_MACROS, PLAYER_OBJECTIVES } from '@/lib/calculations';
import ConfirmModal from '@/components/modals/ConfirmModal';
import DayTypeModal from '@/components/modals/DayTypeModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

const COLORS = ['blue', 'teal', 'green', 'orange', 'red', 'grape', 'cyan', 'pink', 'yellow'];

export default function TeamConfigClient({ team, readOnly = false }) {
  const [loading, setLoading] = useState(false);
  
  const [teamName, setTeamName] = useState(team.nombre || '');
  const [teamSeason, setTeamSeason] = useState(team.temporada || '');

  const [dayTypes, setDayTypes] = useState(() => {
    if (team.configuracion_nutricional?.dayTypes) return team.configuracion_nutricional.dayTypes;
    return JSON.parse(JSON.stringify(NUTRITION_DAY_TYPES));
  });
  
  const [objectiveMacros, setObjectiveMacros] = useState(() => {
    if (team.configuracion_nutricional?.objectiveMacros) return team.configuracion_nutricional.objectiveMacros;
    return JSON.parse(JSON.stringify(OBJECTIVE_DAY_TYPE_MACROS));
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDayType, setEditingDayType] = useState(null);
  const [deleteDayTypeKey, setDeleteDayTypeKey] = useState(null);

  const handleSaveDayType = () => {
    let finalKey = editingDayType.key;
    if (!finalKey) {
      finalKey = slugify(editingDayType.label, '_');
    }
    if (!finalKey || !editingDayType.label) return;
    
    const finalDayType = { ...editingDayType, key: finalKey };
    
    setDayTypes(current => {
      const exists = current.findIndex(d => d.key === finalKey);
      if (exists >= 0) {
        const next = [...current];
        next[exists] = finalDayType;
        return next;
      }
      return [...current, finalDayType];
    });

    setObjectiveMacros(current => {
      const next = { ...current };
      PLAYER_OBJECTIVES.forEach(obj => {
        if (!next[obj.value]) next[obj.value] = {};
        if (!next[obj.value][finalKey]) {
           const fallback = next[obj.value]['entreno'] || { kcalPerKg: 25, proteinGkg: 2, carbsGkg: 3, fatGkg: 1 };
           next[obj.value][finalKey] = { ...fallback };
        }
      });
      return next;
    });

    setModalOpen(false);
  };

  const removeDayType = (key) => {
    setDeleteDayTypeKey(key);
  };

  const confirmRemoveDayType = () => {
    if (!deleteDayTypeKey) return;
    setDayTypes(current => current.filter(d => d.key !== deleteDayTypeKey));
    setDeleteDayTypeKey(null);
  };

  const updateMacro = (objective, dayTypeKey, field, value) => {
    setObjectiveMacros(current => {
      const next = { ...current };
      if (!next[objective]) next[objective] = {};
      if (!next[objective][dayTypeKey]) next[objective][dayTypeKey] = {};
      next[objective][dayTypeKey][field] = value;
      return next;
    });
  };

  const saveConfig = async () => {
    if (!teamName) {
      notifications.show({ title: 'Error', message: 'El nombre del equipo no puede estar vacío', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      const teamRes = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          team_id: team.id,
          nombre: teamName,
          temporada: teamSeason,
          descripcion: team.descripcion,
        })
      });
      if (!teamRes.ok) throw new Error('Error actualizando los datos básicos del equipo');

      const res = await fetch(`/api/teams/${team.id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuracion_nutricional: {
            dayTypes,
            objectiveMacros
          }
        })
      });

      if (!res.ok) throw new Error('Error guardando configuración nutricional');
      notifications.show({ title: 'Guardado exitoso', message: 'Los ajustes del equipo se han actualizado.', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BoneyardSkeleton name="team-config" loading={false}>
      <Stack gap="xl">
        {/* Botón de guardar maestro en la parte superior para alinearse con el resto de la app */}
        {!readOnly && (
          <Group justify="flex-end">
            <Button loading={loading} onClick={saveConfig} leftSection={<IconDeviceFloppy size={18} />} size="md" radius="xl" color="blue">
              Guardar Cambios
            </Button>
          </Group>
        )}

        <Paper p="md" radius="lg" shadow="sm" withBorder style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))' }}>
          <Group gap="sm" mb="lg">
            <ThemeIcon size="md" radius="xl" variant="light" color="blue">
              <IconSettings size={18} />
            </ThemeIcon>
            <Title order={4} c="dark.4">Información del Equipo</Title>
          </Group>
          <Group align="flex-end" wrap="wrap" gap="md">
            <TextInput 
              label="Nombre del equipo" 
              value={teamName} 
              onChange={(e) => setTeamName(e.currentTarget.value)} 
              readOnly={readOnly}
              variant={readOnly ? 'filled' : 'default'}
              style={{ flex: 1, minWidth: 200 }}
              fw={readOnly ? 600 : 400}
              size="md"
              radius="md"
            />
            <TextInput 
              label="Temporada" 
              value={teamSeason} 
              onChange={(e) => setTeamSeason(e.currentTarget.value)} 
              readOnly={readOnly}
              variant={readOnly ? 'filled' : 'default'}
              placeholder="Ej: 2026/27"
              style={{ width: 160 }}
              size="md"
              radius="md"
            />
          </Group>
        </Paper>

        <Paper p="md" radius="lg" shadow="sm" withBorder>
          <Group justify="space-between" mb="lg">
            <Group gap="sm">
              <ThemeIcon size="md" radius="xl" variant="light" color="grape">
                <IconCalendarStats size={18} />
              </ThemeIcon>
              <Title order={4} c="dark.4">Tipos de Día</Title>
            </Group>
            {!readOnly && (
              <Button 
                leftSection={<IconPlus size={14} />} 
                size="sm" 
                radius="xl"
                variant="light"
                color="blue"
                onClick={() => {
                  const randomColor = COLORS[dayTypes.length % COLORS.length];
                  setEditingDayType({ key: '', label: '', planLabel: '', color: randomColor });
                  setModalOpen(true);
                }}
              >
                Nuevo Tipo
              </Button>
            )}
          </Group>

          <Table verticalSpacing="md" horizontalSpacing="md" striped highlightOnHover style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
            <Table.Tbody>
              {dayTypes.map(d => (
                <Table.Tr key={d.key}>
                  <Table.Td>
                     <Group gap="sm">
                       <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: `var(--mantine-color-${d.color}-6)` }} />
                       <Text fw={600} size="sm" c="dark.4">{d.label}</Text>
                     </Group>
                  </Table.Td>
                  {!readOnly && (
                    <Table.Td w={120}>
                      <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <ActionIcon variant="light" color="blue" radius="xl" size="md" onClick={() => { setEditingDayType(d); setModalOpen(true); }}>
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon variant="light" color="red" radius="xl" size="md" onClick={() => removeDayType(d.key)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        <Paper p="md" radius="lg" shadow="sm" withBorder>
          <Title order={4} mb="md" c="dark.4">Multiplicadores por Objetivo</Title>
          <Accordion variant="separated" radius="md">
            {PLAYER_OBJECTIVES.map(obj => (
              <Accordion.Item key={obj.value} value={obj.value} style={{ backgroundColor: 'white' }}>
                <Accordion.Control fw={600} c="dark.3">{obj.label}</Accordion.Control>
                <Accordion.Panel>
                  <div style={{ overflowX: 'auto' }}>
                    <Table verticalSpacing="sm" striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ minWidth: 150 }}>Tipo de Día</Table.Th>
                          <Table.Th>Kcal / Kg</Table.Th>
                          <Table.Th>Prot (g/kg)</Table.Th>
                          <Table.Th>HC (g/kg)</Table.Th>
                          <Table.Th>Grasa (g/kg)</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {dayTypes.map(d => {
                          const macros = objectiveMacros[obj.value]?.[d.key] || { kcalPerKg: 0, proteinGkg: 0, carbsGkg: 0, fatGkg: 0 };
                          return (
                            <Table.Tr key={d.key}>
                              <Table.Td>
                                <Group gap="xs">
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: `var(--mantine-color-${d.color}-6)` }} />
                                  <Text size="sm" fw={500} c="dark.4">{d.label}</Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <NumberInput value={macros.kcalPerKg} onChange={(v) => updateMacro(obj.value, d.key, 'kcalPerKg', v)} decimalScale={2} hideControls readOnly={readOnly} variant={readOnly ? 'unstyled' : 'filled'} radius="md" style={{ minWidth: 75 }} />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput value={macros.proteinGkg} onChange={(v) => updateMacro(obj.value, d.key, 'proteinGkg', v)} decimalScale={2} hideControls readOnly={readOnly} variant={readOnly ? 'unstyled' : 'filled'} radius="md" style={{ minWidth: 75 }} />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput value={macros.carbsGkg} onChange={(v) => updateMacro(obj.value, d.key, 'carbsGkg', v)} decimalScale={2} hideControls readOnly={readOnly} variant={readOnly ? 'unstyled' : 'filled'} radius="md" style={{ minWidth: 75 }} />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput value={macros.fatGkg} onChange={(v) => updateMacro(obj.value, d.key, 'fatGkg', v)} decimalScale={2} hideControls readOnly={readOnly} variant={readOnly ? 'unstyled' : 'filled'} radius="md" style={{ minWidth: 75 }} />
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Paper>

        <DayTypeModal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          editingDayType={editingDayType}
          setEditingDayType={setEditingDayType}
          COLORS={COLORS}
          handleSaveDayType={handleSaveDayType}
        />
        <ConfirmModal
          opened={!!deleteDayTypeKey}
          onClose={() => setDeleteDayTypeKey(null)}
          onConfirm={confirmRemoveDayType}
          title="Eliminar tipo de día"
          message="¿Seguro que quieres eliminar este tipo de día?"
          confirmLabel="Eliminar"
        />
      </Stack>
    </BoneyardSkeleton>
  );
}
