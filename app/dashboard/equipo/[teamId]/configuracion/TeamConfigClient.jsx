'use client';

import { useState } from 'react';
import { slugify } from '@/lib/utils';
import { Button, Group, Stack, TextInput, NumberInput, Accordion, Paper, Title, ActionIcon, Table, Text, ThemeIcon, Tooltip, Badge, Textarea, Anchor, Box, ColorInput, SimpleGrid } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconDeviceFloppy, IconPencil, IconCalendarStats, IconSettings, IconArrowLeft, IconBook, IconClipboardList, IconPalette } from '@tabler/icons-react';
import { NUTRITION_DAY_TYPES, OBJECTIVE_DAY_TYPE_MACROS, PLAYER_OBJECTIVES } from '@/lib/calculations';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/modals/ConfirmModal';
import DayTypeModal from '@/components/modals/DayTypeModal';
import ProtocolEditorModal from '@/components/modals/ProtocolEditorModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

const COLORS = ['blue', 'teal', 'green', 'orange', 'red', 'grape', 'cyan', 'pink', 'yellow'];

export default function TeamConfigClient({ team, readOnly = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [teamName, setTeamName] = useState(team.nombre || '');
  const [teamSeason, setTeamSeason] = useState(team.temporada || '');

  const [pdfMicrocycle, setPdfMicrocycle] = useState(team.configuracion_nutricional?.pdfMicrocycle || '');
  const [pdfRules, setPdfRules] = useState(team.configuracion_nutricional?.pdfRules || '');
  const [pdfBuffet, setPdfBuffet] = useState(team.configuracion_nutricional?.pdfBuffet || '');

  const [dayTypes, setDayTypes] = useState(() => {
    let list = [];
    if (team.configuracion_nutricional?.dayTypes) {
      list = team.configuracion_nutricional.dayTypes;
    } else {
      list = JSON.parse(JSON.stringify(NUTRITION_DAY_TYPES));
    }
    return list.map((d) => ({
      ...d,
      tienePostentreno: d.tienePostentreno !== undefined
        ? d.tienePostentreno
        : (d.tienePreentreno !== undefined ? d.tienePreentreno : ['doble', 'entreno', 'partido'].includes(d.key)),
      tienePreentreno: d.tienePreentreno !== undefined ? d.tienePreentreno : ['doble', 'entreno', 'partido'].includes(d.key)
    }));
  });

  const [objectiveMacros, setObjectiveMacros] = useState(() => {
    if (team.configuracion_nutricional?.objectiveMacros) return team.configuracion_nutricional.objectiveMacros;
    return JSON.parse(JSON.stringify(OBJECTIVE_DAY_TYPE_MACROS));
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDayType, setEditingDayType] = useState(null);
  const [deleteDayTypeKey, setDeleteDayTypeKey] = useState(null);

  const [protocols, setProtocols] = useState(() => {
    return team.configuracion_nutricional?.protocols || [];
  });
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState(null);
  const [deleteProtocolId, setDeleteProtocolId] = useState(null);

  const [planColors, setPlanColors] = useState(() => {
    const raw = team.configuracion_nutricional?.planColors || {};
    return {
      cardTopBg: raw.cardTopBg || '#254d5c',
      cardTopText: raw.cardTopText || '#cad6df',
      cardBodyBg: raw.cardBodyBg || '#101229',
      cardBodyText: raw.cardBodyText || '#ffffff',
      boxBg: raw.boxBg || raw.dayBoxBg || raw.suppBoxBg || '#151932',
      boxBorder: raw.boxBorder || raw.dayBoxBorder || raw.suppBoxBorder || '#2d335a',
      itemBg: raw.itemBg || raw.mealBoxBg || raw.suppItemBg || '#1d1f46',
      accentText: raw.accentText || raw.mealTitleText || raw.suppTitleText || '#ffa94d',
      itemText: raw.itemText || raw.mealDescText || raw.notesDescText || '#dee2e6'
    };
  });

  const handleColorChange = (field, value) => {
    setPlanColors(prev => ({ ...prev, [field]: value }));
  };

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
            objectiveMacros,
            protocols,
            pdfMicrocycle,
            pdfRules,
            pdfBuffet,
            planColors
          }
        })
      });

      if (!res.ok) throw new Error('Error guardando configuración nutricional');
      notifications.show({ title: 'Guardado exitoso', message: 'Los ajustes del equipo se han actualizado.', color: 'green' });
      router.refresh();
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BoneyardSkeleton name="team-config" loading={false}>
      <Stack gap="lg">
        {/* Cabecera integrada con el botón de guardar */}
        <Paper
          p={{ base: 'sm', sm: 'md' }}
          shadow="xs"
          radius={24}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
            zIndex: 10,
            position: 'relative',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm" wrap="nowrap">
              <Tooltip label="Volver al equipo" withArrow>
                <ActionIcon component={Anchor} href={`/dashboard/equipo/${team.id}`} variant="light" color="gray" radius="xl" size={42}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
              </Tooltip>
              <ThemeIcon color="blue" variant="light" radius="xl" size={42}>
                <IconSettings size={21} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={850} c="#24291f" lh={1.1}>
                  Configuración Nutricional
                </Title>
                <Text size="xs" c="dimmed" mt={2}>
                  {teamName || team.nombre || 'Equipo'} · Personaliza tipos de día y multiplicadores de macros
                </Text>
              </Box>
            </Group>

            <Group gap="xs" wrap="wrap" justify="flex-end">
              {!readOnly && (
                <Button loading={loading} onClick={saveConfig} leftSection={<IconDeviceFloppy size={18} />} size="sm" radius="xl" color="blue">
                  Guardar Cambios
                </Button>
              )}
            </Group>
          </Group>
        </Paper>

        <Paper p="md" radius="lg" shadow="sm" withBorder bg="white">
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
          <Group gap="sm" mb="lg">
            <ThemeIcon size="md" radius="xl" variant="light" color="gray">
              <IconBook size={18} />
            </ThemeIcon>
            <Title order={4} c="dark.4">Textos Base para PDF</Title>
          </Group>
          <Stack gap="md">
            <Textarea
              label="Microciclo / calendario"
              placeholder="Ej. Partido Domingo vs Barcelona. Lunes y Martes entreno normal..."
              value={pdfMicrocycle}
              onChange={(e) => setPdfMicrocycle(e.currentTarget.value)}
              readOnly={readOnly}
              minRows={3}
              autosize
            />
            <Textarea
              label="Reglas de la semana"
              placeholder="Ej. Hidratación regular, suplementación básica..."
              value={pdfRules}
              onChange={(e) => setPdfRules(e.currentTarget.value)}
              readOnly={readOnly}
              minRows={4}
              autosize
            />
            <Textarea
              label="Equipamiento del buffet"
              placeholder="Ej. Indicaciones de cómo servirse según día de entreno/partido..."
              value={pdfBuffet}
              onChange={(e) => setPdfBuffet(e.currentTarget.value)}
              readOnly={readOnly}
              minRows={4}
              autosize
            />
          </Stack>
        </Paper>

        <Paper p="md" radius="lg" shadow="sm" withBorder>
          <Group gap="sm" mb="lg">
            <ThemeIcon size="md" radius="xl" variant="light" color="pink">
              <IconPalette size={18} />
            </ThemeIcon>
            <Title order={4} c="dark.4">Colores del Plan Nutricional</Title>
          </Group>
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Box>
                <Text size="xs" fw={800} c="dimmed" mb="xs" tt="uppercase" letterSpacing={1}>1. Estructura y Cabecera</Text>
                <Stack gap="xs">
                  <ColorInput label="Fondo Ficha General" value={planColors.cardBodyBg} onChange={(c) => handleColorChange('cardBodyBg', c)} readOnly={readOnly} />
                  <ColorInput label="Fondo Barra Superior" value={planColors.cardTopBg} onChange={(c) => handleColorChange('cardTopBg', c)} readOnly={readOnly} />
                  <ColorInput label="Texto Barra Superior" value={planColors.cardTopText} onChange={(c) => handleColorChange('cardTopText', c)} readOnly={readOnly} />
                </Stack>
              </Box>
              
              <Box>
                <Text size="xs" fw={800} c="dimmed" mb="xs" tt="uppercase" letterSpacing={1}>2. Tarjetas y Cajas</Text>
                <Stack gap="xs">
                  <ColorInput label="Fondo Tarjetas (Días/Notas)" value={planColors.boxBg} onChange={(c) => handleColorChange('boxBg', c)} readOnly={readOnly} />
                  <ColorInput label="Borde de Tarjetas" value={planColors.boxBorder} onChange={(c) => handleColorChange('boxBorder', c)} readOnly={readOnly} />
                  <ColorInput label="Fondo Comidas y Suplementos" value={planColors.itemBg} onChange={(c) => handleColorChange('itemBg', c)} readOnly={readOnly} />
                </Stack>
              </Box>

              <Box>
                <Text size="xs" fw={800} c="dimmed" mb="xs" tt="uppercase" letterSpacing={1}>3. Textos y Tipografía</Text>
                <Stack gap="xs">
                  <ColorInput label="Nombre y Títulos Principales" value={planColors.cardBodyText} onChange={(c) => handleColorChange('cardBodyText', c)} readOnly={readOnly} />
                  <ColorInput label="Títulos de Comidas (PRE, etc.)" value={planColors.accentText} onChange={(c) => handleColorChange('accentText', c)} readOnly={readOnly} />
                  <ColorInput label="Detalle de Menús y Notas" value={planColors.itemText} onChange={(c) => handleColorChange('itemText', c)} readOnly={readOnly} />
                </Stack>
              </Box>
            </SimpleGrid>
            
            <Box mt="xs">
              <Text size="sm" fw={800} c="dimmed" mb="sm" tt="uppercase" letterSpacing={1}>Vista Previa en Vivo</Text>
              
              <Paper shadow="sm" radius="md" withBorder style={{ backgroundColor: planColors.cardBodyBg, overflow: 'hidden', transition: 'background-color 0.3s ease', width: '100%' }}>
                <Box style={{ backgroundColor: planColors.cardTopBg, color: planColors.cardTopText, padding: '14px 10px', textAlign: 'center', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.3s ease' }}>
                  Valencia CF · Nutrición Deportiva
                </Box>
                <Box p="lg">
                  <Title order={3} style={{ color: planColors.cardBodyText, textAlign: 'center', fontSize: '20px', lineHeight: 1, textTransform: 'uppercase', transition: 'color 0.3s ease' }}>JUGADOR EJEMPLO</Title>
                  <Text style={{ color: '#ff8b52', textAlign: 'center', textTransform: 'uppercase', fontWeight: 800, marginTop: '4px', fontSize: '10px' }}>CENTROCAMPISTA</Text>
                  <div style={{ height: '2px', background: '#ff785f', margin: '10px auto 20px', maxWidth: '80%' }} />
                  
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Stack gap="sm">
                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Group justify="space-between" mb="xs">
                          <Text fw={900} size="xs" style={{ color: planColors.cardBodyText, transition: 'color 0.3s ease' }}>LUNES</Text>
                          <Badge size="xs" color="teal" variant="light">Partido</Badge>
                        </Group>
                        <Box p="xs" style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', transition: 'background-color 0.3s ease' }}>
                          <Text size="xs" fw={800} tt="uppercase" lh={1.1} style={{ color: planColors.accentText }}>PRE-PARTIDO</Text>
                          <Text size="xs" mt={2} style={{ color: planColors.itemText, lineHeight: 1.3 }}>Pasta blanca con pollo a la plancha</Text>
                        </Box>
                      </Paper>
                      
                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Group justify="space-between" mb="xs">
                          <Text fw={900} size="xs" style={{ color: planColors.cardBodyText, transition: 'color 0.3s ease' }}>MARTES</Text>
                          <Badge size="xs" color="blue" variant="light">Descanso</Badge>
                        </Group>
                        <Box p="xs" style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', transition: 'background-color 0.3s ease' }}>
                          <Text size="xs" fw={800} tt="uppercase" lh={1.1} style={{ color: planColors.accentText }}>DESAYUNO</Text>
                          <Text size="xs" mt={2} style={{ color: planColors.itemText, lineHeight: 1.3 }}>Tostadas integrales con aguacate y huevo</Text>
                        </Box>
                      </Paper>
                    </Stack>

                    <Stack gap="sm">
                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Title order={6} tt="uppercase" mb="xs" style={{ color: planColors.accentText, fontSize: '11px' }}>Suplementación</Title>
                        <Paper p="xs" style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', transition: 'background-color 0.3s ease' }}>
                          <Group justify="space-between" wrap="nowrap" align="flex-start">
                            <Text size="xs" fw={800} style={{ color: planColors.cardBodyText }}>Cafeína</Text>
                            <Badge color="teal" size="xs" variant="filled" radius="xs">200mg</Badge>
                          </Group>
                          <Text size="xs" mt={2} style={{ color: planColors.itemText }}>Momento: 45m antes</Text>
                        </Paper>
                      </Paper>

                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Title order={6} tt="uppercase" mb="xs" style={{ color: planColors.accentText, fontSize: '11px' }}>Indicaciones</Title>
                        <Text size="xs" style={{ color: planColors.itemText, lineHeight: 1.3 }}>• Mantener buena hidratación</Text>
                        <Text size="xs" style={{ color: planColors.itemText, lineHeight: 1.3 }}>• Pesar antes y después del partido</Text>
                      </Paper>
                    </Stack>
                  </SimpleGrid>
                </Box>
              </Paper>
            </Box>
          </Stack>
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
                  setEditingDayType({ key: '', label: '', planLabel: '', color: randomColor, tienePostentreno: false, tienePreentreno: false });
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
                  <Table.Td>
                    <Badge variant="light" color={(d.tienePostentreno !== undefined ? d.tienePostentreno : d.tienePreentreno) ? 'teal' : 'gray'}>
                      {(d.tienePostentreno !== undefined ? d.tienePostentreno : d.tienePreentreno) ? 'Post-entreno' : 'Sin Post-entreno'}
                    </Badge>
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
          <Group justify="space-between" mb="lg">
            <Group gap="sm">
              <ThemeIcon size="md" radius="xl" variant="light" color="cyan">
                <IconClipboardList size={18} />
              </ThemeIcon>
              <Title order={4} c="dark.4">Protocolos por Tipo de Día</Title>
            </Group>
          </Group>

          <Accordion variant="separated" radius="md">
            {dayTypes.map(d => {
              const dayProtocols = protocols.filter(p => p.dayTypeKey === d.key);
              return (
                <Accordion.Item key={d.key} value={d.key} style={{ backgroundColor: 'white' }}>
                  <Accordion.Control>
                    <Group gap="sm">
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: `var(--mantine-color-${d.color}-6)` }} />
                      <Text fw={600} c="dark.3">{d.label}</Text>
                      <Badge size="xs" variant="light" color="gray">{dayProtocols.length} protocolos</Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="md">
                      {!readOnly && (
                        <Button
                          variant="light"
                          color="blue"
                          size="xs"
                          leftSection={<IconPlus size={14} />}
                          onClick={() => {
                            setEditingProtocol({ dayTypeKey: d.key, name: '', timeline: [], checklist: [] });
                            setProtocolModalOpen(true);
                          }}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          Nuevo Protocolo para {d.label}
                        </Button>
                      )}

                      {dayProtocols.length === 0 ? (
                        <Text c="dimmed" size="sm">No hay protocolos configurados para este tipo de día.</Text>
                      ) : (
                        <Table verticalSpacing="sm" striped highlightOnHover>
                          <Table.Tbody>
                            {dayProtocols.map(p => (
                              <Table.Tr key={p.id}>
                                <Table.Td>
                                  <Text fw={500} size="sm">{p.name}</Text>
                                  <Text size="xs" c="dimmed">{p.timeline?.length || 0} pasos · {p.checklist?.length || 0} checks</Text>
                                </Table.Td>
                                {!readOnly && (
                                  <Table.Td w={120}>
                                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                                      <ActionIcon variant="light" color="blue" radius="xl" size="md" onClick={() => { setEditingProtocol(p); setProtocolModalOpen(true); }}>
                                        <IconPencil size={16} />
                                      </ActionIcon>
                                      <ActionIcon variant="light" color="red" radius="xl" size="md" onClick={() => setDeleteProtocolId(p.id)}>
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    </Group>
                                  </Table.Td>
                                )}
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      )}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
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
        <ConfirmModal
          opened={!!deleteProtocolId}
          onClose={() => setDeleteProtocolId(null)}
          onConfirm={() => {
            setProtocols(current => current.filter(p => p.id !== deleteProtocolId));
            setDeleteProtocolId(null);
          }}
          title="Eliminar protocolo"
          message="¿Seguro que quieres eliminar este protocolo? Los jugadores que ya lo hayan personalizado mantendrán su copia local."
          confirmLabel="Eliminar"
        />
        <ProtocolEditorModal
          opened={protocolModalOpen}
          onClose={() => setProtocolModalOpen(false)}
          protocol={editingProtocol}
          onSave={(savedProtocol) => {
            setProtocols(current => {
              const exists = current.findIndex(p => p.id === savedProtocol.id);
              if (exists >= 0) {
                const next = [...current];
                next[exists] = savedProtocol;
                return next;
              }
              return [...current, savedProtocol];
            });
          }}
        />
      </Stack>
    </BoneyardSkeleton>
  );
}
