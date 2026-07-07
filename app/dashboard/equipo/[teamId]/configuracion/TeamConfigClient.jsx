'use client';

import { useState } from 'react';
import { slugify } from '@/lib/utils';
import { Button, Group, Stack, TextInput, NumberInput, Select, Accordion, Paper, Title, ActionIcon, Table, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconDeviceFloppy, IconPencil } from '@tabler/icons-react';
import { NUTRITION_DAY_TYPES, OBJECTIVE_DAY_TYPE_MACROS, PLAYER_OBJECTIVES } from '@/lib/calculations';

const COLORS = ['blue', 'teal', 'green', 'orange', 'red', 'grape', 'cyan', 'pink', 'yellow'];

export default function TeamConfigClient({ team }) {
  const [loading, setLoading] = useState(false);
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
           // use defaults or copy from entreno
           const fallback = next[obj.value]['entreno'] || { kcalPerKg: 25, proteinGkg: 2, carbsGkg: 3, fatGkg: 1 };
           next[obj.value][finalKey] = { ...fallback };
        }
      });
      return next;
    });

    setModalOpen(false);
  };

  const removeDayType = (key) => {
    if (!confirm('¿Seguro que quieres eliminar este tipo de día?')) return;
    setDayTypes(current => current.filter(d => d.key !== key));
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
    setLoading(true);
    try {
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

      if (!res.ok) throw new Error('Error guardando configuración');
      notifications.show({ title: 'Guardado', message: 'Configuración actualizada', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="xl">
      <Paper p="md" radius="lg" shadow="sm" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Tipos de Día</Title>
          <Button 
            leftSection={<IconPlus size={14} />} 
            size="xs" 
            onClick={() => {
              setEditingDayType({ key: '', label: '', planLabel: '', color: 'blue' });
              setModalOpen(true);
            }}
          >
            Añadir
          </Button>
        </Group>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tipo de Día</Table.Th>
              <Table.Th>Color</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {dayTypes.map(d => (
              <Table.Tr key={d.key}>
                <Table.Td>{d.label}</Table.Td>
                <Table.Td>{d.color}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon onClick={() => { setEditingDayType(d); setModalOpen(true); }}><IconPencil size={16} /></ActionIcon>
                    <ActionIcon color="red" onClick={() => removeDayType(d.key)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Paper p="md" radius="lg" shadow="sm" withBorder>
        <Title order={4} mb="md">Multiplicadores por Objetivo</Title>
        <Accordion variant="separated">
          {PLAYER_OBJECTIVES.map(obj => (
            <Accordion.Item key={obj.value} value={obj.value}>
              <Accordion.Control>{obj.label}</Accordion.Control>
              <Accordion.Panel>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tipo de Día</Table.Th>
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
                          <Table.Td>{d.label}</Table.Td>
                          <Table.Td>
                            <NumberInput value={macros.kcalPerKg} onChange={(v) => updateMacro(obj.value, d.key, 'kcalPerKg', v)} decimalScale={2} hideControls />
                          </Table.Td>
                          <Table.Td>
                            <NumberInput value={macros.proteinGkg} onChange={(v) => updateMacro(obj.value, d.key, 'proteinGkg', v)} decimalScale={2} hideControls />
                          </Table.Td>
                          <Table.Td>
                            <NumberInput value={macros.carbsGkg} onChange={(v) => updateMacro(obj.value, d.key, 'carbsGkg', v)} decimalScale={2} hideControls />
                          </Table.Td>
                          <Table.Td>
                            <NumberInput value={macros.fatGkg} onChange={(v) => updateMacro(obj.value, d.key, 'fatGkg', v)} decimalScale={2} hideControls />
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Paper>

      <Group justify="flex-end">
        <Button loading={loading} onClick={saveConfig} leftSection={<IconDeviceFloppy size={16} />}>
          Guardar Configuración
        </Button>
      </Group>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingDayType?.key ? 'Editar Tipo de Día' : 'Nuevo Tipo de Día'}>
        {editingDayType && (
          <Stack>
            <TextInput 
              label="Nombre del Tipo de Día" 
              value={editingDayType.label} 
              onChange={e => {
                const val = e.target.value;
                setEditingDayType({
                  ...editingDayType, 
                  label: val, 
                  planLabel: val.toLowerCase().startsWith('día') || val.toLowerCase().startsWith('dia') ? val : `Día ${val.toLowerCase()}`
                });
              }} 
            />
            <Select label="Color" data={COLORS.map(c => ({ value: c, label: c }))} value={editingDayType.color} onChange={v => setEditingDayType({...editingDayType, color: v})} />
            <Button onClick={handleSaveDayType} fullWidth mt="md">Aceptar</Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
