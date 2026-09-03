'use client';

import { useState, useMemo, useEffect } from 'react';

import { slugify } from '@/lib/utils';
import { Button, Group, Stack, TextInput, NumberInput, Accordion, Paper, Title, ActionIcon, Table, Text, ThemeIcon, Tooltip, Badge, Textarea, Anchor, Box, ColorInput, SimpleGrid, Avatar, FileButton, UnstyledButton, Modal } from '@mantine/core';
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

function getInitialDayTypes(config) {
  let list = [];
  if (config?.dayTypes) {
    list = config.dayTypes;
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
}

function getInitialColors(teamData) {
  const raw = teamData?.configuracion_nutricional?.planColors || {};
  return {
    cardTopBg: raw.cardTopBg || '#254d5c',
    cardTopText: raw.cardTopText || '#cad6df',
    cardBodyBg: raw.cardBodyBg || '#101229',
    cardBodyText: raw.cardBodyText || '#ffffff',
    boxBg: raw.boxBg || raw.dayBoxBg || raw.suppBoxBg || '#151932',
    boxBorder: raw.boxBorder || raw.dayBoxBorder || raw.suppBoxBorder || '#1f2444',
    itemBg: raw.itemBg || raw.mealBoxBg || raw.suppItemBg || '#1d1f46',
    accentText: raw.accentText || raw.mealTitleText || raw.suppTitleText || '#ffa94d',
    itemText: raw.itemText || raw.mealDescText || raw.notesDescText || '#dee2e6'
  };
}

export default function TeamConfigClient({ team, user: _user, availableTeams: _availableTeams = [], readOnly = false }) {
  const router = useRouter();
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

  const [savingSection, setSavingSection] = useState(null);

  const [savedBaselines, setSavedBaselines] = useState(() => ({
    info: {
      nombre: team.nombre || '',
      temporada: team.temporada || ''
    },
    pdf: {
      pdfMicrocycle: team.configuracion_nutricional?.pdfMicrocycle || '',
      pdfRules: team.configuracion_nutricional?.pdfRules || '',
      pdfBuffet: team.configuracion_nutricional?.pdfBuffet || ''
    },
    dayTypes: getInitialDayTypes(team.configuracion_nutricional),
    macros: team.configuracion_nutricional?.objectiveMacros || JSON.parse(JSON.stringify(OBJECTIVE_DAY_TYPE_MACROS)),
    protocols: team.configuracion_nutricional?.protocols || [],
    colors: getInitialColors(team)
  }));

  useEffect(() => {
    setSavedBaselines({
      info: {
        nombre: team.nombre || '',
        temporada: team.temporada || ''
      },
      pdf: {
        pdfMicrocycle: team.configuracion_nutricional?.pdfMicrocycle || '',
        pdfRules: team.configuracion_nutricional?.pdfRules || '',
        pdfBuffet: team.configuracion_nutricional?.pdfBuffet || ''
      },
      dayTypes: getInitialDayTypes(team.configuracion_nutricional),
      macros: team.configuracion_nutricional?.objectiveMacros || JSON.parse(JSON.stringify(OBJECTIVE_DAY_TYPE_MACROS)),
      protocols: team.configuracion_nutricional?.protocols || [],
      colors: getInitialColors(team)
    });
  }, [team]);

  const hasInfoChanges = useMemo(() => {
    return teamName !== savedBaselines.info.nombre || teamSeason !== savedBaselines.info.temporada;
  }, [teamName, teamSeason, savedBaselines.info]);

  const hasPdfChanges = useMemo(() => {
    return pdfMicrocycle !== savedBaselines.pdf.pdfMicrocycle || pdfRules !== savedBaselines.pdf.pdfRules || pdfBuffet !== savedBaselines.pdf.pdfBuffet;
  }, [pdfMicrocycle, pdfRules, pdfBuffet, savedBaselines.pdf]);

  const hasColorChanges = useMemo(() => {
    return JSON.stringify(planColors) !== JSON.stringify(savedBaselines.colors);
  }, [planColors, savedBaselines.colors]);

  const hasDayTypeChanges = useMemo(() => {
    return JSON.stringify(dayTypes) !== JSON.stringify(savedBaselines.dayTypes);
  }, [dayTypes, savedBaselines.dayTypes]);

  const hasProtocolChanges = useMemo(() => {
    return JSON.stringify(protocols) !== JSON.stringify(savedBaselines.protocols);
  }, [protocols, savedBaselines.protocols]);

  const hasMacroChanges = useMemo(() => {
    return JSON.stringify(objectiveMacros) !== JSON.stringify(savedBaselines.macros);
  }, [objectiveMacros, savedBaselines.macros]);

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
    const isEditing = Boolean(editingDayType.key && dayTypes.some(d => d.key === editingDayType.key));

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
    notifications.show({
      title: isEditing ? 'Tipo de día preparado en la lista' : 'Tipo de día añadido a la lista',
      message: 'Pulsa "Guardar Tipos de Día" para confirmar los cambios en el equipo.',
      color: 'blue'
    });
  };

  const removeDayType = (key) => {
    setDeleteDayTypeKey(key);
  };

  const confirmRemoveDayType = () => {
    if (!deleteDayTypeKey) return;
    setDayTypes(current => current.filter(d => d.key !== deleteDayTypeKey));
    setDeleteDayTypeKey(null);
    notifications.show({
      title: 'Tipo de día eliminado de la lista',
      message: 'Pulsa "Guardar Tipos de Día" para confirmar la eliminación.',
      color: 'orange'
    });
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

  const saveSection = async (sectionKey) => {
    if (sectionKey === 'info') {
      if (!teamName) {
        notifications.show({ title: 'Error', message: 'El nombre del equipo no puede estar vacío', color: 'red' });
        return;
      }
      setSavingSection('info');
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
        if (!teamRes.ok) throw new Error('Error actualizando la información del equipo');
        setSavedBaselines(prev => ({
          ...prev,
          info: { nombre: teamName, temporada: teamSeason }
        }));
        notifications.show({ title: 'Guardado exitoso', message: 'Información básica del equipo actualizada.', color: 'green' });
        router.refresh();
      } catch (e) {
        notifications.show({ title: 'Error', message: e.message, color: 'red' });
      } finally {
        setSavingSection(null);
      }
      return;
    }

    setSavingSection(sectionKey);
    try {
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

      if (!res.ok) throw new Error('Error guardando la configuración');

      // Actualizar inmediatamente la línea base de la sección guardada para limpiar "Cambios sin guardar"
      setSavedBaselines(prev => {
        const next = { ...prev };
        if (sectionKey === 'pdf') {
          next.pdf = { pdfMicrocycle, pdfRules, pdfBuffet };
        } else if (sectionKey === 'colors') {
          next.colors = JSON.parse(JSON.stringify(planColors));
        } else if (sectionKey === 'dayTypes') {
          next.dayTypes = JSON.parse(JSON.stringify(dayTypes));
        } else if (sectionKey === 'protocols') {
          next.protocols = JSON.parse(JSON.stringify(protocols));
        } else if (sectionKey === 'macros') {
          next.macros = JSON.parse(JSON.stringify(objectiveMacros));
        }
        return next;
      });

      const labels = {
        pdf: 'Textos de PDF guardados',
        colors: 'Colores del plan guardados',
        dayTypes: 'Tipos de día guardados',
        protocols: 'Protocolos guardados',
        macros: 'Multiplicadores de macros guardados'
      };

      notifications.show({
        title: 'Guardado exitoso',
        message: labels[sectionKey] || 'Sección guardada correctamente.',
        color: 'green'
      });
      router.refresh();
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <BoneyardSkeleton name="team-config" loading={false}>
      <Stack gap="lg">
        {/* Cabecera integrada */}
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
                  {teamName || team.nombre || 'Equipo'} · Ajusta y guarda cada sección individualmente
                </Text>
              </Box>
            </Group>
          </Group>
        </Paper>

        <Paper p="md" radius="lg" shadow="sm" withBorder bg="white">
          <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
            <Group gap="sm">
              <ThemeIcon size="md" radius="xl" variant="light" color="blue">
                <IconSettings size={18} />
              </ThemeIcon>
              <Box>
                <Group gap="xs" align="center">
                  <Title order={4} c="dark.4">Información del Equipo</Title>
                  {hasInfoChanges && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={700} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && hasInfoChanges && (
              <Button
                size="xs"
                radius="xl"
                color="teal"
                loading={savingSection === 'info'}
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={() => saveSection('info')}
              >
                Guardar Información
              </Button>
            )}
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
          <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
            <Group gap="sm">
              <ThemeIcon size="md" radius="xl" variant="light" color="gray">
                <IconBook size={18} />
              </ThemeIcon>
              <Box>
                <Group gap="xs" align="center">
                  <Title order={4} c="dark.4">Textos Base para PDF</Title>
                  {hasPdfChanges && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={700} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && hasPdfChanges && (
              <Button
                size="xs"
                radius="xl"
                color="teal"
                loading={savingSection === 'pdf'}
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={() => saveSection('pdf')}
              >
                Guardar Textos PDF
              </Button>
            )}
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
          <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
            <Group gap="sm">
              <ThemeIcon size="md" radius="xl" variant="light" color="pink">
                <IconPalette size={18} />
              </ThemeIcon>
              <Box>
                <Group gap="xs" align="center">
                  <Title order={4} c="dark.4">Colores del Plan Nutricional</Title>
                  {hasColorChanges && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={700} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && (
              <Group gap="xs">
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
                {hasColorChanges && (
                  <Button
                    size="xs"
                    radius="xl"
                    color="teal"
                    loading={savingSection === 'colors'}
                    leftSection={<IconDeviceFloppy size={14} />}
                    onClick={() => saveSection('colors')}
                  >
                    Guardar Colores
                  </Button>
                )}
              </Group>
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
                        <Box py={2} px={6} mb={6} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
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
                        <Box py={2} px={6} mb={6} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
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
                        <Box p="xs" style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', transition: 'background-color 0.3s ease' }}>
                          <Group justify="space-between" wrap="nowrap" align="flex-start">
                            <Text size="xs" fw={800} style={{ color: planColors.cardBodyText }}>Cafeína</Text>
                            <Text size="11px" fw={800} style={{ color: planColors.accentText, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '1px 5px' }}>200mg</Text>
                          </Group>
                          <Text size="xs" mt={2} style={{ color: planColors.itemText }}>Momento: 45m antes</Text>
                        </Box>
                      </Paper>
                    </Stack>

                    <Stack gap="sm">
                      <Paper p="sm" radius="md" style={{ backgroundColor: planColors.boxBg, border: `1px solid ${planColors.boxBorder}`, transition: 'all 0.3s ease' }}>
                        <Title order={6} tt="uppercase" mb="xs" style={{ color: planColors.accentText, fontSize: '11px' }}>Protocolo de Partido</Title>
                        <Box p="xs" style={{ backgroundColor: planColors.itemBg, borderRadius: '4px', transition: 'background-color 0.3s ease' }} mb={6}>
                          <Group justify="space-between" wrap="nowrap" align="center">
                            <Group gap={6} align="center" wrap="nowrap">
                              <ProtocolIcon iconName="IconApple" size={13} color={planColors.accentText} />
                              <Text size="xs" fw={800} style={{ color: planColors.cardBodyText }}>Comida Pre-partido</Text>
                            </Group>
                            <Text size="11px" fw={800} style={{ color: planColors.accentText, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '1px 5px' }}>-3h</Text>
                          </Group>
                          <Text size="xs" mt={2} style={{ color: planColors.itemText }}>Pasta blanca + pollo magro</Text>
                        </Box>
                        <Box p={6} style={{ backgroundColor: planColors.itemBg, borderRadius: '4px' }}>
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
              Haz clic en un tema para cargarlo en la vista previa y editarlo. Pulsa luego <strong>Guardar Colores</strong> para aplicar los cambios permanentemente en el equipo.
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
                          color: 'blue',
                          title: 'Tema cargado en vista previa',
                          message: `Has seleccionado ${preset.name}. Haz clic en "Guardar Colores" para confirmar los cambios.`,
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
          <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
            <Group gap="sm">
              <ThemeIcon size="md" radius="xl" variant="light" color="grape">
                <IconCalendarStats size={18} />
              </ThemeIcon>
              <Box>
                <Group gap="xs" align="center">
                  <Title order={4} c="dark.4">Tipos de Día</Title>
                  {hasDayTypeChanges && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={700} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && (
              <Group gap="xs">
                <Button
                  leftSection={<IconPlus size={14} />}
                  size="xs"
                  radius="xl"
                  color="blue"
                  variant="light"
                  onClick={() => {
                    setEditingDayType({ label: '', key: '', color: 'blue', tienePreentreno: true, tienePostentreno: true });
                    setModalOpen(true);
                  }}
                >
                  Nuevo Tipo de Día
                </Button>
                {hasDayTypeChanges && (
                  <Button
                    size="xs"
                    radius="xl"
                    color="teal"
                    loading={savingSection === 'dayTypes'}
                    leftSection={<IconDeviceFloppy size={14} />}
                    onClick={() => saveSection('dayTypes')}
                  >
                    Guardar Tipos de Día
                  </Button>
                )}
              </Group>
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

          {hasDayTypeChanges && !readOnly && (
            <Group justify="flex-end" mt="md" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
              <Group gap="xs">
                <Group gap={4} align="center" wrap="nowrap">
                  <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                  <Text size="xs" fw={700} c="orange.7">Tienes cambios sin guardar en los tipos de día</Text>
                </Group>
                <Button
                  size="xs"
                  radius="xl"
                  color="teal"
                  loading={savingSection === 'dayTypes'}
                  leftSection={<IconDeviceFloppy size={14} />}
                  onClick={() => saveSection('dayTypes')}
                >
                  Guardar Tipos de Día
                </Button>
              </Group>
            </Group>
          )}
        </Paper>

        <Paper p="md" radius="lg" shadow="sm" withBorder>
          <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
            <Group gap="sm">
              <ThemeIcon size="md" radius="xl" variant="light" color="cyan">
                <IconClipboardList size={18} />
              </ThemeIcon>
              <Box>
                <Group gap="xs" align="center">
                  <Title order={4} c="dark.4">Protocolos por Tipo de Día</Title>
                  {hasProtocolChanges && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={700} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && (
              <Group gap="xs">
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
                {hasProtocolChanges && (
                  <Button
                    size="xs"
                    radius="xl"
                    color="teal"
                    loading={savingSection === 'protocols'}
                    leftSection={<IconDeviceFloppy size={14} />}
                    onClick={() => saveSection('protocols')}
                  >
                    Guardar Protocolos
                  </Button>
                )}
              </Group>
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

          {hasProtocolChanges && !readOnly && (
            <Group justify="flex-end" mt="md" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
              <Group gap="xs">
                <Group gap={4} align="center" wrap="nowrap">
                  <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                  <Text size="xs" fw={700} c="orange.7">Tienes cambios sin guardar en los protocolos</Text>
                </Group>
                <Button
                  size="xs"
                  radius="xl"
                  color="teal"
                  loading={savingSection === 'protocols'}
                  leftSection={<IconDeviceFloppy size={14} />}
                  onClick={() => saveSection('protocols')}
                >
                  Guardar Protocolos
                </Button>
              </Group>
            </Group>
          )}
        </Paper>

        <Paper p="md" radius="lg" shadow="sm" withBorder>
          <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="sm">
            <Box>
              <Group gap="xs" align="center">
                <Title order={4} c="dark.4">Multiplicadores por Objetivo</Title>
                {hasMacroChanges && (
                  <Group gap={4} align="center" wrap="nowrap">
                    <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                    <Text size="xs" fw={700} c="orange.7">Cambios sin guardar</Text>
                  </Group>
                )}
              </Group>
            </Box>
            {!readOnly && hasMacroChanges && (
              <Button
                size="xs"
                radius="xl"
                color="teal"
                loading={savingSection === 'macros'}
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={() => saveSection('macros')}
              >
                Guardar Multiplicadores
              </Button>
            )}
          </Group>
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

          {hasMacroChanges && !readOnly && (
            <Group justify="flex-end" mt="md" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
              <Group gap="xs">
                <Group gap={4} align="center" wrap="nowrap">
                  <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                  <Text size="xs" fw={700} c="orange.7">Tienes cambios sin guardar en los multiplicadores</Text>
                </Group>
                <Button
                  size="xs"
                  radius="xl"
                  color="teal"
                  loading={savingSection === 'macros'}
                  leftSection={<IconDeviceFloppy size={14} />}
                  onClick={() => saveSection('macros')}
                >
                  Guardar Multiplicadores
                </Button>
              </Group>
            </Group>
          )}
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
            notifications.show({
              title: 'Protocolo eliminado de la lista',
              message: 'Pulsa "Guardar Protocolos" para confirmar la eliminación.',
              color: 'orange'
            });
          }}
          title="Eliminar protocolo"
          message="¿Seguro que quieres eliminar este protocolo? Los jugadores que ya lo hayan personalizado mantendrán su copia local."
          confirmLabel="Eliminar"
        />
        <ProtocolEditorModal
          opened={protocolModalOpen}
          onClose={() => setProtocolModalOpen(false)}
          protocol={editingProtocol}
          saveLabel="Aceptar"
          helpText="Al aceptar, se aplicarán los cambios a la lista. Recuerda pulsar &quot;Guardar Protocolos&quot; para guardarlos en el equipo."
          onSave={(savedProtocol) => {
            const isEditing = Boolean(editingProtocol?.id && editingProtocol.name);
            setProtocols(current => {
              const exists = current.findIndex(p => p.id === savedProtocol.id);
              if (exists >= 0) {
                const next = [...current];
                next[exists] = savedProtocol;
                return next;
              }
              return [...current, savedProtocol];
            });
            notifications.show({
              title: isEditing ? 'Protocolo preparado en la lista' : 'Protocolo añadido a la lista',
              message: 'Pulsa "Guardar Protocolos" para guardar los cambios en el equipo.',
              color: 'blue'
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
              setProtocols(current => {
                const next = current.filter(p => p.id !== protocol.id);
                setSavedBaselines(prev => ({
                  ...prev,
                  protocols: JSON.parse(JSON.stringify(next))
                }));
                return next;
              });
              router.refresh();
            }
          }}
        />
        <ProtocolImportModal
          opened={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          currentTeamId={team.id}
          currentDayTypes={dayTypes}
          onImported={(imported) => {
            setProtocols(current => {
              const next = [...current, ...imported];
              setSavedBaselines(prev => ({
                ...prev,
                protocols: JSON.parse(JSON.stringify(next))
              }));
              return next;
            });
            router.refresh();
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
