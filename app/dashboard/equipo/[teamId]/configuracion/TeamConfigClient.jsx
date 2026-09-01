'use client';

import { useState } from 'react';

import { slugify } from '@/lib/utils';
import { Button, Group, Stack, TextInput, NumberInput, Accordion, Paper, Title, ActionIcon, Table, Text, ThemeIcon, Tooltip, Badge, Textarea, Anchor, Box, ColorInput, SimpleGrid, Avatar, FileButton, UnstyledButton, Divider, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconDeviceFloppy, IconPencil, IconCalendarStats, IconSettings, IconArrowLeft, IconBook, IconClipboardList, IconPalette, IconCamera, IconFolderShare, IconDownload } from '@tabler/icons-react';
import { NUTRITION_DAY_TYPES, OBJECTIVE_DAY_TYPE_MACROS, PLAYER_OBJECTIVES } from '@/lib/calculations';
import { compressAvatar, initials } from '@/lib/avatar';
import { uploadTeamPhoto, removeTeamPhoto } from '@/services/team';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/modals/ConfirmModal';
import DayTypeModal from '@/components/modals/DayTypeModal';
import ProtocolEditorModal from '@/components/modals/ProtocolEditorModal';
import ProtocolTransferModal from '@/components/modals/ProtocolTransferModal';
import ProtocolImportModal from '@/components/modals/ProtocolImportModal';
import ImageCropModal from '@/components/modals/ImageCropModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

import { PLAN_THEME_PRESETS } from '@/lib/nutrition-plan-card';
import ProtocolIcon from '@/components/ProtocolIcon';

const COLORS = ['blue', 'teal', 'green', 'orange', 'red', 'grape', 'cyan', 'pink', 'yellow'];

export default function TeamConfigClient({ team, user, availableTeams = [], readOnly = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teamPhotoVersion, setTeamPhotoVersion] = useState(() => team.updated_at || Date.now());
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [tempFileName, setTempFileName] = useState('');

  function handleSelectPhoto(file) {
    if (!file || !team?.id) return;
    setTempFileName(file.name || 'team-crest.jpg');
    const localUrl = URL.createObjectURL(file);
    setTempImageSrc(localUrl);
    setCropModalOpen(true);
  }

  function handleCloseCropModal() {
    setCropModalOpen(false);
    if (tempImageSrc) {
      URL.revokeObjectURL(tempImageSrc);
      setTempImageSrc('');
    }
  }

  async function handleCropConfirmed(croppedFile) {
    if (!team?.id) return;
    try {
      const compressed = await compressAvatar(croppedFile);
      await uploadTeamPhoto(team.id, compressed);
      setTeamPhotoVersion(Date.now());
      notifications.show({
        color: 'green',
        title: 'Escudo actualizado',
        message: 'La imagen del equipo se ha guardado correctamente.',
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al subir imagen',
        message: err.message,
      });
    }
  }

  async function handleRemovePhoto() {
    if (!team?.id) return;
    try {
      await removeTeamPhoto(team.id);
      setTeamPhotoVersion(Date.now());
      notifications.show({
        color: 'green',
        title: 'Escudo eliminado',
        message: 'La foto del equipo se ha eliminado.',
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al eliminar imagen',
        message: err.message,
      });
    }
  }

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
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferProtocol, setTransferProtocol] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [themesModalOpen, setThemesModalOpen] = useState(false);

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
          <Group align="center" wrap="wrap" gap="xl">
            <Stack align="center" gap="xs">
              <Box style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={team?.id ? `/api/teams/avatar?id=${team.id}&t=${teamPhotoVersion}` : undefined}
                  size={72}
                  radius="md"
                  color="blue"
                  style={{
                    border: '2.5px solid white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    backgroundColor: 'var(--mantine-color-blue-1)',
                    color: 'var(--mantine-color-blue-8)',
                    fontWeight: 700,
                    fontSize: '20px',
                  }}
                >
                  {initials(teamName || team.nombre || 'Equipo')}
                </Avatar>
                {!readOnly && team?.id && (
                  <FileButton onChange={handleSelectPhoto} accept="image/*">
                    {(props) => (
                      <Tooltip label="Cambiar escudo/foto" position="top" withArrow>
                        <ActionIcon
                          {...props}
                          variant="filled"
                          color="dark"
                          radius="xl"
                          size={22}
                          style={{
                            position: 'absolute',
                            bottom: -3,
                            right: -3,
                            border: '1.5px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                          }}
                        >
                          <IconCamera size={12} stroke={2} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </FileButton>
                )}
              </Box>
              {!readOnly && (
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  radius="xl"
                  leftSection={<IconTrash size={12} />}
                  onClick={handleRemovePhoto}
                >
                  Eliminar foto
                </Button>
              )}
            </Stack>

            <Group align="flex-end" wrap="wrap" gap="md" style={{ flex: 1 }}>
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
          <Group justify="space-between" align="center" mb="lg">
            <Group gap="sm">
              <ThemeIcon size="md" radius="xl" variant="light" color="pink">
                <IconPalette size={18} />
              </ThemeIcon>
              <Title order={4} c="dark.4">Colores del Plan Nutricional</Title>
            </Group>
            {!readOnly && (
              <Button
                variant="light"
                size="xs"
                radius="xl"
                color="pink"
                leftSection={<IconPalette size={14} />}
                onClick={() => setThemesModalOpen(true)}
              >
                Temas Predefinidos
              </Button>
            )}
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
                  {teamName || team?.nombre || 'Club'} · Nutrición Deportiva
                </Box>
                <Box p="lg">
                  <Title order={3} style={{ color: planColors.cardBodyText, textAlign: 'center', fontSize: '20px', lineHeight: 1, textTransform: 'uppercase', transition: 'color 0.3s ease' }}>JUGADOR EJEMPLO</Title>
                  <Text style={{ color: planColors.accentText, textAlign: 'center', textTransform: 'uppercase', fontWeight: 800, marginTop: '4px', fontSize: '10px' }}>CENTROCAMPISTA</Text>
                  <div style={{ height: '2px', background: planColors.accentText, margin: '10px auto 16px', maxWidth: '75%', opacity: 0.8 }} />
                  
                  <SimpleGrid cols={3} spacing="xs" mb="md">
                    <Paper p="xs" radius="sm" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, textAlign: 'center' }}>
                      <Text size="9px" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.6px' }}>PESO</Text>
                      <Text size="xs" fw={850} style={{ color: planColors.accentText }}>77.4 kg</Text>
                    </Paper>
                    <Paper p="xs" radius="sm" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, textAlign: 'center' }}>
                      <Text size="9px" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.6px' }}>GRASA</Text>
                      <Text size="xs" fw={850} style={{ color: planColors.cardBodyText }}>9.8 %</Text>
                    </Paper>
                    <Paper p="xs" radius="sm" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, textAlign: 'center' }}>
                      <Text size="9px" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.6px' }}>% MÚSCULO</Text>
                      <Text size="xs" fw={850} style={{ color: planColors.accentText }}>48.2 %</Text>
                    </Paper>
                  </SimpleGrid>

                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    <Stack gap="sm">
                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Group justify="space-between" align="center" mb={6}>
                          <Text fw={900} size="xs" style={{ color: planColors.cardBodyText, transition: 'color 0.3s ease' }}>LUNES</Text>
                          <Group gap={4} align="center" wrap="nowrap">
                            <span style={{ fontSize: '7px', color: 'var(--mantine-color-teal-5)' }}>●</span>
                            <Text size="11px" fw={700} tt="uppercase" c="teal.4">Partido</Text>
                          </Group>
                        </Group>
                        <Box py={2} px={6} mb={6} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${planColors.boxBorder}`, borderRadius: '4px' }}>
                          <Group gap={4} justify="space-between" wrap="nowrap">
                            <Text size="10px" fw={800} style={{ color: planColors.cardBodyText }}>
                              3.150 <span style={{ fontWeight: 400, opacity: 0.65, fontSize: '9px' }}>kcal</span>
                            </Text>
                            <Text size="10px" style={{ color: planColors.itemText }}>
                              P 160g · HC 430g · G 65g
                            </Text>
                          </Group>
                        </Box>
                        <Box p="xs" style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', transition: 'background-color 0.3s ease' }}>
                          <Text size="xs" fw={800} tt="uppercase" lh={1.1} style={{ color: planColors.accentText }}>PRE-PARTIDO</Text>
                          <Text size="xs" mt={2} style={{ color: planColors.itemText, lineHeight: 1.3 }}>Pasta blanca con pollo a la plancha</Text>
                        </Box>
                      </Paper>
                      
                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Group justify="space-between" align="center" mb={6}>
                          <Text fw={900} size="xs" style={{ color: planColors.cardBodyText, transition: 'color 0.3s ease' }}>MARTES</Text>
                          <Group gap={4} align="center" wrap="nowrap">
                            <span style={{ fontSize: '7px', color: 'var(--mantine-color-blue-5)' }}>●</span>
                            <Text size="11px" fw={700} tt="uppercase" c="blue.4">Descanso</Text>
                          </Group>
                        </Group>
                        <Box py={2} px={6} mb={6} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${planColors.boxBorder}`, borderRadius: '4px' }}>
                          <Group gap={4} justify="space-between" wrap="nowrap">
                            <Text size="10px" fw={800} style={{ color: planColors.cardBodyText }}>
                              2.450 <span style={{ fontWeight: 400, opacity: 0.65, fontSize: '9px' }}>kcal</span>
                            </Text>
                            <Text size="10px" style={{ color: planColors.itemText }}>
                              P 170g · HC 220g · G 70g
                            </Text>
                          </Group>
                        </Box>
                        <Box p="xs" style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', transition: 'background-color 0.3s ease' }}>
                          <Text size="xs" fw={800} tt="uppercase" lh={1.1} style={{ color: planColors.accentText }}>DESAYUNO</Text>
                          <Text size="xs" mt={2} style={{ color: planColors.itemText, lineHeight: 1.3 }}>Tostadas integrales con aguacate y huevo</Text>
                        </Box>
                      </Paper>

                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Title order={6} tt="uppercase" mb="xs" style={{ color: planColors.accentText, fontSize: '11px' }}>Suplementación Pautada</Title>
                        <Paper p="xs" style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', border: `1px solid ${planColors.boxBorder}`, transition: 'background-color 0.3s ease' }}>
                          <Group justify="space-between" wrap="nowrap" align="flex-start">
                            <Text size="xs" fw={800} style={{ color: planColors.cardBodyText }}>Cafeína</Text>
                            <Text size="11px" fw={800} style={{ color: planColors.accentText, border: `1px solid ${planColors.boxBorder}`, borderRadius: '4px', padding: '1px 5px' }}>200mg</Text>
                          </Group>
                          <Text size="xs" mt={2} style={{ color: planColors.itemText }}>Momento: 45m antes</Text>
                        </Paper>
                      </Paper>
                    </Stack>

                    <Stack gap="sm">
                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Title order={6} tt="uppercase" mb="xs" style={{ color: planColors.accentText, fontSize: '11px' }}>Protocolo de Partido</Title>
                        <Paper p="xs" style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', border: `1px solid ${planColors.boxBorder}`, transition: 'background-color 0.3s ease' }} mb={6}>
                          <Group justify="space-between" wrap="nowrap" align="center">
                            <Group gap={6} align="center" wrap="nowrap">
                              <ProtocolIcon iconName="IconApple" size={13} color={planColors.accentText} />
                              <Text size="xs" fw={800} style={{ color: planColors.cardBodyText }}>Comida Pre-partido</Text>
                            </Group>
                            <Text size="11px" fw={800} style={{ color: planColors.accentText, border: `1px solid ${planColors.boxBorder}`, borderRadius: '4px', padding: '1px 5px' }}>-3h</Text>
                          </Group>
                          <Text size="xs" mt={2} style={{ color: planColors.itemText }}>Pasta blanca + pollo magro</Text>
                        </Paper>
                        <Box p={6} style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', border: `1px solid ${planColors.boxBorder}` }}>
                          <Group gap={6} align="flex-start" wrap="nowrap">
                            <Text size="11px" style={{ color: planColors.accentText }}>✓</Text>
                            <Text size="xs" fw={700} style={{ color: planColors.cardBodyText }}>Hidratación electrolítica</Text>
                          </Group>
                        </Box>
                      </Paper>

                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Title order={6} tt="uppercase" mb="xs" style={{ color: planColors.accentText, fontSize: '11px' }}>Indicaciones de la semana</Title>
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

        <Modal
          opened={themesModalOpen}
          onClose={() => setThemesModalOpen(false)}
          title="Temas Predefinidos del Plan Nutricional"
          size="lg"
          radius="md"
        >
          <Stack gap="md">
            <Text size="xs" c="dimmed">
              Selecciona una paleta prediseñada para aplicar instantáneamente todos sus colores al equipo.
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {PLAN_THEME_PRESETS.map((preset) => {
                const isSelected = planColors.cardBodyBg === preset.colors.cardBodyBg &&
                                   planColors.cardTopBg === preset.colors.cardTopBg &&
                                   planColors.boxBg === preset.colors.boxBg &&
                                   planColors.accentText === preset.colors.accentText;
                return (
                  <UnstyledButton
                    key={preset.id}
                    onClick={() => {
                      if (!readOnly) {
                        setPlanColors(preset.colors);
                        setThemesModalOpen(false);
                        notifications.show({
                          color: 'green',
                          title: 'Tema aplicado',
                          message: `Se aplicó el tema ${preset.name}.`,
                        });
                      }
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--mantine-color-teal-6)' : '1px solid var(--mantine-color-gray-3)',
                      backgroundColor: isSelected ? 'var(--mantine-color-teal-0)' : 'var(--mantine-color-gray-0)',
                      cursor: readOnly ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Group justify="space-between" align="center" wrap="nowrap" mb={4}>
                      <Text size="xs" fw={700} c={isSelected ? 'teal.9' : 'dark.5'}>
                        {preset.name}
                      </Text>
                      <Group gap={3}>
                        {preset.swatches.map((s, idx) => (
                          <Box
                            key={idx}
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: s,
                              border: '1px solid rgba(0,0,0,0.15)',
                            }}
                          />
                        ))}
                      </Group>
                    </Group>
                    <Text size="11px" c="dimmed" lh={1.3}>
                      {preset.description}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </SimpleGrid>
          </Stack>
        </Modal>

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
                color="blue"
                onClick={() => {
                  setEditingDayType({ label: '', key: '', color: 'blue', tienePreentreno: true, tienePostentreno: true });
                  setModalOpen(true);
                }}
              >
                Nuevo Tipo de Día
              </Button>
            )}
          </Group>

          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tipo de Día</Table.Th>
                <Table.Th>Color</Table.Th>
                <Table.Th>Batido de proteínas</Table.Th>
                {!readOnly && <Table.Th w={100} style={{ textAlign: 'right' }}>Acciones</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {dayTypes.map(d => (
                <Table.Tr key={d.key}>
                  <Table.Td>
                    <Group gap="xs">
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: `var(--mantine-color-${d.color}-6)` }} />
                      <Text fw={500} size="sm">{d.label}</Text>
                      <Text size="xs" c="dimmed">({d.key})</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" tt="capitalize" c={d.color}>{d.color}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={(d.tienePostentreno !== undefined ? d.tienePostentreno : d.tienePreentreno) ? 'teal' : 'dimmed'} fw={500}>
                      {(d.tienePostentreno !== undefined ? d.tienePostentreno : d.tienePreentreno) ? 'Sí' : 'No'}
                    </Text>
                  </Table.Td>
                  {!readOnly && (
                    <Table.Td>
                      <Group gap="xs" justify="flex-end">
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
            {!readOnly && (
              <Button
                variant="light"
                color="blue"
                size="xs"
                radius="xl"
                leftSection={<IconDownload size={14} />}
                onClick={() => setImportModalOpen(true)}
              >
                Importar de otro equipo
              </Button>
            )}
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
                            const isMatch = d.key === 'partido' || d.key === 'match_day' || (typeof d.key === 'string' && d.key.includes('partido'));
                            setEditingProtocol({ dayTypeKey: d.key, name: '', timeline: [], checklist: [], incluirEnPlan: isMatch });
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
                            {dayProtocols.map(p => {
                              const isIncludedInPlan = p.incluirEnPlan !== false && (p.incluirEnPlan === true || p.dayTypeKey === 'partido' || p.dayTypeKey === 'match_day' || (typeof p.dayTypeKey === 'string' && p.dayTypeKey.includes('partido')));
                              return (
                                <Table.Tr key={p.id}>
                                  <Table.Td>
                                    <Group gap="xs" align="center">
                                      <Text fw={500} size="sm">{p.name}</Text>
                                      {isIncludedInPlan && (
                                        <Group gap={4} align="center">
                                          <span style={{ color: 'var(--mantine-color-teal-6)', fontSize: 10 }}>●</span>
                                          <Text size="xs" c="teal.7" fw={600}>En planificación</Text>
                                        </Group>
                                      )}
                                    </Group>
                                    <Text size="xs" c="dimmed">{p.timeline?.length || 0} pasos · {p.checklist?.length || 0} checks</Text>
                                  </Table.Td>
                                  {!readOnly && (
                                    <Table.Td w={150}>
                                      <Group gap="xs" justify="flex-end" wrap="nowrap">
                                        <Tooltip label="Copiar o mover a otro equipo" withArrow>
                                          <ActionIcon 
                                            variant="light" 
                                            color="cyan" 
                                            radius="xl" 
                                            size="md" 
                                            onClick={() => { 
                                              setTransferProtocol(p); 
                                              setTransferModalOpen(true); 
                                            }}
                                          >
                                            <IconFolderShare size={16} />
                                          </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Editar protocolo" withArrow>
                                          <ActionIcon variant="light" color="blue" radius="xl" size="md" onClick={() => { setEditingProtocol(p); setProtocolModalOpen(true); }}>
                                            <IconPencil size={16} />
                                          </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Eliminar protocolo" withArrow>
                                          <ActionIcon variant="light" color="red" radius="xl" size="md" onClick={() => setDeleteProtocolId(p.id)}>
                                            <IconTrash size={16} />
                                          </ActionIcon>
                                        </Tooltip>
                                      </Group>
                                    </Table.Td>
                                  )}
                                </Table.Tr>
                              );
                            })}
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
        <ProtocolTransferModal
          opened={transferModalOpen}
          onClose={() => {
            setTransferModalOpen(false);
            setTransferProtocol(null);
          }}
          protocol={transferProtocol}
          currentTeamId={team.id}
          currentTeamName={teamName || team.nombre}
          currentDayTypes={dayTypes}
          onTransferred={({ action, protocol }) => {
            if (action === 'move') {
              setProtocols(current => current.filter(p => p.id !== protocol.id));
            }
          }}
        />
        <ProtocolImportModal
          opened={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          currentTeamId={team.id}
          currentDayTypes={dayTypes}
          onImported={(imported) => {
            setProtocols(current => [...current, ...imported]);
          }}
        />

        <ImageCropModal
          opened={cropModalOpen}
          onClose={handleCloseCropModal}
          imageSrc={tempImageSrc}
          fileName={tempFileName}
          cropShape="rect"
          aspect={1}
          title="Ajustar escudo / foto del equipo"
          onCropConfirmed={handleCropConfirmed}
        />
      </Stack>
    </BoneyardSkeleton>
  );
}
