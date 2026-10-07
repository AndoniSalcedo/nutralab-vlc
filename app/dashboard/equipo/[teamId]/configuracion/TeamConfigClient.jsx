'use client';

import { useState, useMemo, useEffect } from 'react';

import { slugify } from '@/lib/utils';
import { Button, Group, Stack, TextInput, NumberInput, Accordion, Paper, ActionIcon, Table, Text, Tooltip, Textarea, Box, Avatar, FileButton, ScrollArea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconDeviceFloppy, IconPencil, IconCalendarStats, IconSettings, IconBook, IconClipboardList, IconCamera, IconFolderShare, IconDownload, IconCalculator } from '@/components/icons3d';
import { calcKcalPerKg } from '@/config/day-types/macros';
import { PLAYER_OBJECTIVES } from '@/config/nutrition-days';
import { FOOTBALL_DAY_TYPES, FOOTBALL_OBJECTIVE_MACROS } from '@/config/day-types/football';
import { resolvePlanColors } from '@/config/plan-themes';
import PlanThemeEditor from '@/components/plan/PlanThemeEditor';
import { compressAvatar, initials } from '@/lib/utils/avatar';
import { uploadTeamPhoto, removeTeamPhoto, updateTeam, saveTeamConfig } from '@/actions/teamActions';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/modals/ConfirmModal';
import DayTypeModal from '@/components/modals/DayTypeModal';
import ProtocolEditorModal from '@/components/modals/ProtocolEditorModal';
import ProtocolTransferModal from '@/components/modals/ProtocolTransferModal';
import ProtocolImportModal from '@/components/modals/ProtocolImportModal';
import ImageCropModal from '@/components/modals/ImageCropModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

const COLORS = ['blue', 'teal', 'green', 'orange', 'red', 'grape', 'cyan', 'pink', 'yellow'];

function getInitialDayTypes(config) {
  let list = [];
  if (config?.dayTypes) {
    list = config.dayTypes;
  } else {
    list = JSON.parse(JSON.stringify(FOOTBALL_DAY_TYPES));
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
  return resolvePlanColors(teamData?.configuracion_nutricional?.planColors);
}

export default function TeamConfigClient({ team, readOnly = false }) {
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
      list = JSON.parse(JSON.stringify(FOOTBALL_DAY_TYPES));
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
    return JSON.parse(JSON.stringify(FOOTBALL_OBJECTIVE_MACROS));
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

  const [planColors, setPlanColors] = useState(() => getInitialColors(team));

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
    macros: team.configuracion_nutricional?.objectiveMacros || JSON.parse(JSON.stringify(FOOTBALL_OBJECTIVE_MACROS)),
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
      macros: team.configuracion_nutricional?.objectiveMacros || JSON.parse(JSON.stringify(FOOTBALL_OBJECTIVE_MACROS)),
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
      next[objective][dayTypeKey].kcalPerKg = calcKcalPerKg(next[objective][dayTypeKey]);
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
        await updateTeam(team.id, {
          nombre: teamName,
          temporada: teamSeason,
          descripcion: team.descripcion,
        });
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
      await saveTeamConfig(team.id, {
        dayTypes,
        objectiveMacros,
        protocols,
        pdfMicrocycle,
        pdfRules,
        pdfBuffet,
        planColors
      });

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
        <Paper p="md" radius={24} shadow="xs">
          <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm" style={{ width: '100%' }}>
            <Group gap="sm" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <IconSettings size={20} style={{ flexShrink: 0 }} />
              <Box style={{ minWidth: 0 }}>
                <Group gap="xs" align="center" wrap="wrap">
                  <Text fz={13} fw={700} c="dark.5">General</Text>
                  {hasInfoChanges && (

                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={600} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && hasInfoChanges && (
              <Button
                size="xs"
                radius="xl"
                color="nutralabColor.8"
                w={{ base: '100%', sm: 'auto' }}
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
                  src={team?.id ? `/api/media/team-avatar?id=${team.id}&t=${teamPhotoVersion}` : undefined}
                  size={96}
                  radius="xl"
                  color="nutralabColor"
                  style={{
                    width: 96,
                    height: 96,
                    border: '3px solid white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    backgroundColor: '#ffffff',
                    color: 'var(--mantine-color-nutralabColor-9)',
                    fontWeight: 600,
                    fontSize: '24px',
                  }}
                  imageProps={{
                    style: {
                      objectFit: 'contain',
                      backgroundColor: '#ffffff',
                      padding: '6px',
                    },
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

            <Group align="flex-end" wrap="wrap" gap="md" style={{ flex: 1, minWidth: 0, width: '100%' }}>
              <TextInput
                label="Nombre del equipo"
                value={teamName}
                onChange={(e) => setTeamName(e.currentTarget.value)}
                readOnly={readOnly}
                variant={readOnly ? 'filled' : 'default'}
                style={{ flex: '2 1 200px', minWidth: 0 }}
                w={{ base: '100%', sm: 'auto' }}
                fw={readOnly ? 600 : 400}
                size="md"
                radius="xl"
              />
              <TextInput
                label="Temporada"
                value={teamSeason}
                onChange={(e) => setTeamSeason(e.currentTarget.value)}
                readOnly={readOnly}
                variant={readOnly ? 'filled' : 'default'}
                placeholder="Ej: 2026/27"
                style={{ flex: '1 1 140px', minWidth: 0 }}
                w={{ base: '100%', sm: 'auto' }}
                size="md"
                radius="xl"
              />
            </Group>
          </Group>
        </Paper>

        <Paper p="md" radius={24} shadow="xs">
          <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm" style={{ width: '100%' }}>
            <Group gap="sm" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <IconBook size={20} style={{ flexShrink: 0 }} />
              <Box style={{ minWidth: 0 }}>
                <Group gap="xs" align="center" wrap="wrap">
                  <Text fz={13} fw={700} c="dark.5">Textos Base para PDF</Text>
                  {hasPdfChanges && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={600} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && hasPdfChanges && (
              <Button
                size="xs"
                radius="xl"
                color="nutralabColor.8"
                w={{ base: '100%', sm: 'auto' }}
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

        <PlanThemeEditor
          colors={planColors}
          onChange={setPlanColors}
          readOnly={readOnly}
          hasChanges={hasColorChanges}
          saving={savingSection === 'colors'}
          onSave={() => saveSection('colors')}
          clubName={teamName || team?.nombre}
          dayTypes={dayTypes}
        />

        <Paper p="md" radius={24} shadow="xs">
          <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm" style={{ width: '100%' }}>
            <Group gap="sm" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <IconCalendarStats size={20} style={{ flexShrink: 0 }} />
              <Box style={{ minWidth: 0 }}>
                <Group gap="xs" align="center" wrap="wrap">
                  <Text fz={13} fw={700} c="dark.5">Tipos de Día</Text>
                  {hasDayTypeChanges && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={600} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && (
              <Group gap="xs" wrap="wrap" w={{ base: '100%', sm: 'auto' }}>
                <Button
                  leftSection={<IconPlus size={14} />}
                  size="xs"
                  radius="xl"
                  variant="default"
                  style={{ flex: '1 1 auto' }}
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
                    color="nutralabColor.8"
                    loading={savingSection === 'dayTypes'}
                    leftSection={<IconDeviceFloppy size={14} />}
                    onClick={() => saveSection('dayTypes')}
                    style={{ flex: '1 1 auto' }}
                  >
                    Guardar Tipos de Día
                  </Button>
                )}
              </Group>
            )}
          </Group>

          <ScrollArea style={{ width: '100%', minWidth: 0 }}>
            <Table verticalSpacing="sm" striped highlightOnHover w="100%" miw={{ base: '100%', sm: 460 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>Tipo de Día</Table.Th>
                  <Table.Th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>Color</Table.Th>
                  <Table.Th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>Batido de proteínas</Table.Th>
                  {!readOnly && <Table.Th w={100} style={{ textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>Acciones</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {dayTypes.map(d => (
                  <Table.Tr key={d.key}>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: `var(--mantine-color-${d.color}-6)`, flexShrink: 0 }} />
                        <Text fw={500} size="sm" truncate>{d.label}</Text>
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
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                          <ActionIcon variant="light" color="gray" radius="xl" size="md" onClick={() => { setEditingDayType(d); setModalOpen(true); }}>
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
          </ScrollArea>

          {hasDayTypeChanges && !readOnly && (
            <Group
              justify="space-between"
              align="center"
              wrap="wrap"
              gap="xs"
              mt="md"
              pt="sm"
              style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
            >
              <Group gap={4} align="center" style={{ flex: '1 1 auto' }}>
                <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                <Text size="xs" fw={600} c="orange.7">Tienes cambios sin guardar en los tipos de día</Text>
              </Group>
              <Button
                size="xs"
                radius="xl"
                color="nutralabColor.8"
                w={{ base: '100%', sm: 'auto' }}
                loading={savingSection === 'dayTypes'}
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={() => saveSection('dayTypes')}
              >
                Guardar Tipos de Día
              </Button>
            </Group>
          )}
        </Paper>

        <Paper p="md" radius={24} shadow="xs">
          <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="sm" style={{ width: '100%' }}>
            <Group gap="sm" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <IconCalculator size={20} style={{ flexShrink: 0 }} />
              <Box style={{ minWidth: 0 }}>
                <Group gap="xs" align="center" wrap="wrap">
                  <Text fz={13} fw={700} c="dark.5">Multiplicadores por Objetivo</Text>
                  {hasMacroChanges && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={600} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && hasMacroChanges && (
              <Button
                size="xs"
                radius="xl"
                color="nutralabColor.8"
                w={{ base: '100%', sm: 'auto' }}
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
                <Accordion.Control fw={600} c="dark.5">{obj.label}</Accordion.Control>
                <Accordion.Panel>
                  <ScrollArea style={{ width: '100%', minWidth: 0 }}>
                    <Table verticalSpacing="sm" striped miw={520}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ minWidth: 150, fontSize: '12px', fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>Tipo de Día</Table.Th>
                          <Table.Th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>Kcal / Kg (auto)</Table.Th>
                          <Table.Th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>Prot (g/kg)</Table.Th>
                          <Table.Th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>HC (g/kg)</Table.Th>
                          <Table.Th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mantine-color-dimmed)' }}>Grasa (g/kg)</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {dayTypes.map(d => {
                          const macros = objectiveMacros[obj.value]?.[d.key] || { kcalPerKg: 0, proteinGkg: 0, carbsGkg: 0, fatGkg: 0 };
                          return (
                            <Table.Tr key={d.key}>
                              <Table.Td>
                                <Group gap="xs" wrap="nowrap">
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: `var(--mantine-color-${d.color}-6)`, flexShrink: 0 }} />
                                  <Text size="sm" fw={500} c="dark.4" truncate>{d.label}</Text>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" fw={600} c="dimmed" style={{ minWidth: 75, paddingLeft: 12 }}>{calcKcalPerKg(macros)}</Text>
                              </Table.Td>
                              <Table.Td>
                                <NumberInput value={macros.proteinGkg} onChange={(v) => updateMacro(obj.value, d.key, 'proteinGkg', v)} decimalScale={2} hideControls readOnly={readOnly} variant={readOnly ? 'unstyled' : 'filled'} radius="xl" style={{ minWidth: 75 }} />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput value={macros.carbsGkg} onChange={(v) => updateMacro(obj.value, d.key, 'carbsGkg', v)} decimalScale={2} hideControls readOnly={readOnly} variant={readOnly ? 'unstyled' : 'filled'} radius="xl" style={{ minWidth: 75 }} />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput value={macros.fatGkg} onChange={(v) => updateMacro(obj.value, d.key, 'fatGkg', v)} decimalScale={2} hideControls readOnly={readOnly} variant={readOnly ? 'unstyled' : 'filled'} radius="xl" style={{ minWidth: 75 }} />
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>

          {hasMacroChanges && !readOnly && (
            <Group
              justify="space-between"
              align="center"
              wrap="wrap"
              gap="xs"
              mt="md"
              pt="sm"
              style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
            >
              <Group gap={4} align="center" style={{ flex: '1 1 auto' }}>
                <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                <Text size="xs" fw={600} c="orange.7">Tienes cambios sin guardar en los multiplicadores</Text>
              </Group>
              <Button
                size="xs"
                radius="xl"
                color="nutralabColor.8"
                w={{ base: '100%', sm: 'auto' }}
                loading={savingSection === 'macros'}
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={() => saveSection('macros')}
              >
                Guardar Multiplicadores
              </Button>
            </Group>
          )}
        </Paper>

        <Paper p="md" radius={24} shadow="xs">
          <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm" style={{ width: '100%' }}>
            <Group gap="sm" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <IconClipboardList size={20} style={{ flexShrink: 0 }} />
              <Box style={{ minWidth: 0 }}>
                <Group gap="xs" align="center" wrap="wrap">
                  <Text fz={13} fw={700} c="dark.5">Protocolos por Tipo de Día</Text>
                  {hasProtocolChanges && (
                    <Group gap={4} align="center" wrap="nowrap">
                      <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                      <Text size="xs" fw={600} c="orange.7">Cambios sin guardar</Text>
                    </Group>
                  )}
                </Group>
              </Box>
            </Group>
            {!readOnly && (
              <Group gap="xs" wrap="wrap" w={{ base: '100%', sm: 'auto' }}>
                <Button
                  variant="default"
                  size="xs"
                  radius="xl"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => setImportModalOpen(true)}
                  style={{ flex: '1 1 auto' }}
                >
                  Importar de otro equipo
                </Button>
                {hasProtocolChanges && (
                  <Button
                    size="xs"
                    radius="xl"
                    color="nutralabColor.8"
                    loading={savingSection === 'protocols'}
                    leftSection={<IconDeviceFloppy size={14} />}
                    onClick={() => saveSection('protocols')}
                    style={{ flex: '1 1 auto' }}
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
                      <Text fw={600} c="dark.5">{d.label}</Text>
                      <Text size="xs" c="dimmed" fw={500}>{dayProtocols.length} {dayProtocols.length === 1 ? 'protocolo' : 'protocolos'}</Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="md">
                      {!readOnly && (
                        <Button
                          variant="default"
                          size="xs"
                          radius="xl"
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
                        <ScrollArea style={{ width: '100%', minWidth: 0 }}>
                          <Table verticalSpacing="sm" striped highlightOnHover w="100%" miw={{ base: '100%', sm: 460 }}>
                            <Table.Tbody>
                              {dayProtocols.map(p => {
                                const isIncludedInPlan = p.incluirEnPlan !== false && (p.incluirEnPlan === true || p.dayTypeKey === 'partido' || p.dayTypeKey === 'match_day' || (typeof p.dayTypeKey === 'string' && p.dayTypeKey.includes('partido')));
                                return (
                                  <Table.Tr key={p.id}>
                                    <Table.Td>
                                      <Group gap="xs" align="center">
                                        <Text fw={500} size="sm" c="dark.5">{p.name}</Text>
                                        {isIncludedInPlan && (
                                          <Group gap={4} align="center">
                                            <span style={{ color: 'var(--mantine-color-teal-6)', fontSize: 10 }}>●</span>
                                            <Text size="xs" c="teal.7" fw={600}>En planificación</Text>
                                          </Group>
                                        )}
                                      </Group>
                                      {(() => {
                                        const suppCount = (p.timeline || []).reduce((acc, step) => acc + (step.suplementos?.length || 0), 0);
                                        return (
                                          <Text size="xs" c="dimmed">
                                            {p.timeline?.length || 0} pasos · {p.checklist?.length || 0} checks
                                            {suppCount > 0 ? ` · ${suppCount} ${suppCount === 1 ? 'suplemento pautado' : 'suplementos pautados'}` : ''}
                                          </Text>
                                        );
                                      })()}
                                    </Table.Td>
                                    {!readOnly && (
                                      <Table.Td w={{ base: 120, sm: 150 }}>
                                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                                          <Tooltip label="Copiar o mover a otro equipo" withArrow>
                                            <ActionIcon
                                              variant="light"
                                              color="gray"
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
                                            <ActionIcon variant="light" color="gray" radius="xl" size="md" onClick={() => { setEditingProtocol(p); setProtocolModalOpen(true); }}>
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
                        </ScrollArea>
                      )}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>

          {hasProtocolChanges && !readOnly && (
            <Group
              justify="space-between"
              align="center"
              wrap="wrap"
              gap="xs"
              mt="md"
              pt="sm"
              style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
            >
              <Group gap={4} align="center" style={{ flex: '1 1 auto' }}>
                <span style={{ fontSize: '7px', color: 'var(--mantine-color-orange-6)' }}>●</span>
                <Text size="xs" fw={600} c="orange.7">Tienes cambios sin guardar en los protocolos</Text>
              </Group>
              <Button
                size="xs"
                radius="xl"
                color="nutralabColor.8"
                w={{ base: '100%', sm: 'auto' }}
                loading={savingSection === 'protocols'}
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={() => saveSection('protocols')}
              >
                Guardar Protocolos
              </Button>
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
              setProtocols(current => current.filter(p => p.id !== protocol.id));
              setSavedBaselines(prev => ({
                ...prev,
                protocols: (prev.protocols || []).filter(p => p.id !== protocol.id)
              }));
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
            setProtocols(current => [...current, ...imported]);
            setSavedBaselines(prev => ({
              ...prev,
              protocols: [...(prev.protocols || []), ...JSON.parse(JSON.stringify(imported))]
            }));
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
    </BoneyardSkeleton >
  );
}
