import React, { useMemo, useState, useEffect } from 'react';
import {
  Stack,
  TextInput,
  Paper,
  Switch,
  Select,
  Group,
  Badge,
  Checkbox,
  ScrollArea,
  Box,
  Button,
  Divider,
  Text,
  SimpleGrid,
  Avatar,
  FileButton,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconSearch, IconCamera, IconTrash } from '@tabler/icons-react';
import { playerFullName } from '@/lib/utils';
import { initials } from '@/lib/avatar';
import ImageCropModal from '@/components/modals/ImageCropModal';

export default function TeamForm({
  submitTeam,
  form,
  setForm,
  sourceTeamOptions = [],
  toggleCreateImport,
  isImportingPlayers = false,
  sourceTeam,
  selectedCount = 0,
  selectedPlayerIds = [],
  onChangeSelectedPlayerIds,
  toggleCopyPlayer,
  saving = false,
  playerCountLabel,
  modalType,
  allPlayers = [],
}) {
  const [filterTeamId, setFilterTeamId] = useState(sourceTeam ? String(sourceTeam.id) : '');
  const [search, setSearch] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [tempFileName, setTempFileName] = useState('');

  useEffect(() => {
    setFilterTeamId(sourceTeam ? String(sourceTeam.id) : '');
    setSearch('');
  }, [sourceTeam, isImportingPlayers]);

  const handleFotoSelected = (file) => {
    if (!file) return;
    setTempFileName(file.name || 'team-crest.jpg');
    const localUrl = URL.createObjectURL(file);
    setTempImageSrc(localUrl);
    setCropModalOpen(true);
  };

  const handleCloseCropModal = () => {
    setCropModalOpen(false);
    if (tempImageSrc) {
      URL.revokeObjectURL(tempImageSrc);
      setTempImageSrc('');
    }
  };

  const handleCropConfirmed = (croppedFile) => {
    const previewUrl = URL.createObjectURL(croppedFile);
    setForm((current) => ({
      ...current,
      fotoFile: croppedFile,
      fotoPreview: previewUrl,
      removeFoto: false,
    }));
  };

  const handleRemoveFoto = () => {
    setForm((current) => ({
      ...current,
      fotoFile: null,
      fotoPreview: '',
      removeFoto: true,
    }));
  };

  const teamFilterOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos los equipos y temporadas' },
      ...sourceTeamOptions,
    ];
  }, [sourceTeamOptions]);

  const displayedPlayers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (allPlayers || []).filter((p) => {
      const matchesTeam = !filterTeamId || String(p.teamId) === String(filterTeamId);
      const nameStr = playerFullName(p, '').toLowerCase();
      const posStr = String(p.posicion || '').toLowerCase();
      const matchesSearch = !needle || nameStr.includes(needle) || posStr.includes(needle);
      return matchesTeam && matchesSearch;
    });
  }, [allPlayers, filterTeamId, search]);

  const displayedSelectedCount = displayedPlayers.filter((p) => selectedPlayerIds.includes(String(p.id))).length;
  const allDisplayedSelected = displayedPlayers.length > 0 && displayedSelectedCount === displayedPlayers.length;
  const someDisplayedSelected = displayedSelectedCount > 0 && displayedSelectedCount < displayedPlayers.length;

  function handleToggleAllDisplayed(checked) {
    const displayedIds = displayedPlayers.map((p) => String(p.id));
    if (checked) {
      const union = Array.from(new Set([...selectedPlayerIds, ...displayedIds]));
      if (onChangeSelectedPlayerIds) onChangeSelectedPlayerIds(union);
    } else {
      const remaining = selectedPlayerIds.filter((id) => !displayedIds.includes(id));
      if (onChangeSelectedPlayerIds) onChangeSelectedPlayerIds(remaining);
    }
  }

  let submitLabel = 'Crear equipo';
  if (modalType === 'edit') {
    submitLabel = 'Guardar cambios';
  } else if (isImportingPlayers) {
    const prefix = modalType === 'copy' ? 'Copiar equipo' : 'Crear equipo';
    submitLabel = selectedCount ? `${prefix} con ${playerCountLabel(selectedCount)}` : prefix;
  }

  return (
    <form onSubmit={submitTeam}>
      <Stack gap="md">
        {/* Selector de foto/logo de equipo */}
        <Stack align="center" gap="xs" mb="xs">
          <Box style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={form.fotoPreview || undefined}
              size={90}
              radius="md"
              color="blue"
              style={{
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: 'var(--mantine-color-blue-1)',
                color: 'var(--mantine-color-blue-8)',
                fontWeight: 700,
                fontSize: '22px',
              }}
            >
              {initials(form.nombre || 'Equipo')}
            </Avatar>

            <FileButton onChange={handleFotoSelected} accept="image/*">
              {(props) => (
                <Tooltip label="Subir escudo/foto" position="top" withArrow>
                  <ActionIcon
                    {...props}
                    variant="filled"
                    color="dark"
                    radius="xl"
                    size="md"
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                    }}
                  >
                    <IconCamera size={14} stroke={2} />
                  </ActionIcon>
                </Tooltip>
              )}
            </FileButton>
          </Box>

          {form.fotoPreview && (
            <Button
              variant="subtle"
              color="red"
              size="xs"
              radius="xl"
              leftSection={<IconTrash size={13} />}
              onClick={handleRemoveFoto}
            >
              Eliminar foto
            </Button>
          )}
        </Stack>

        <TextInput
          label="Nombre del equipo"
          placeholder="Ej. Valencia CF Juvenil A"
          required
          value={form.nombre}
          onChange={(event) => {
            const { value } = event.currentTarget;
            setForm((current) => ({ ...current, nombre: value }));
          }}
        />
        <TextInput
          label="Temporada"
          required
          placeholder="2026/27"
          value={form.temporada}
          onChange={(event) => {
            const { value } = event.currentTarget;
            setForm((current) => ({ ...current, temporada: value }));
          }}
        />
        <TextInput
          label="Descripción"
          placeholder="Opcional"
          value={form.descripcion}
          onChange={(event) => {
            const { value } = event.currentTarget;
            setForm((current) => ({ ...current, descripcion: value }));
          }}
        />

        {modalType === 'create' && allPlayers.length > 0 ? (
          <Paper withBorder radius="md" p="sm" bg={isImportingPlayers ? 'blue.0' : 'gray.0'}>
            <Switch
              label="Importar jugadores de otros equipos / temporadas"
              checked={isImportingPlayers}
              onChange={(event) => toggleCreateImport(event.currentTarget.checked)}
            />
          </Paper>
        ) : null}
        {isImportingPlayers && (
          <>
            <Divider />
            <Stack gap="sm">
              <Group justify="space-between" align="center" wrap="wrap">
                <Box>
                  <Text size="sm" fw={800} c="#24291f">
                    Jugadores a importar
                  </Text>
                  <Text size="xs" c="dimmed">
                    Selecciona jugadores de cualquier equipo o temporada
                  </Text>
                </Box>
                <Badge variant="filled" color={selectedCount ? 'blue' : 'gray'} size="md" radius="sm">
                  {selectedCount} {selectedCount === 1 ? 'jugador seleccionado' : 'jugadores seleccionados'}
                </Badge>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <Select
                  label="Filtrar por equipo"
                  data={teamFilterOptions}
                  value={filterTeamId}
                  onChange={(val) => setFilterTeamId(val || '')}
                  searchable
                  allowDeselect={false}
                  size="xs"
                  radius="md"
                />
                <TextInput
                  label="Buscar jugador"
                  placeholder="Nombre o posición..."
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  leftSection={<IconSearch size={14} />}
                  size="xs"
                  radius="md"
                />
              </SimpleGrid>

              {displayedPlayers.length ? (
                <>
                  <Checkbox
                    label="Seleccionar todos los mostrados"
                    checked={allDisplayedSelected}
                    indeterminate={someDisplayedSelected}
                    onChange={(event) => handleToggleAllDisplayed(event.currentTarget.checked)}
                    size="xs"
                    mt="xs"
                  />
                  <Paper withBorder radius="md" p={0}>
                    <ScrollArea h={Math.min(292, 58 * displayedPlayers.length)} offsetScrollbars>
                      <Stack gap={0}>
                        {displayedPlayers.map((player, index) => {
                          const playerId = String(player.id);
                          const checked = selectedPlayerIds.includes(playerId);

                          return (
                            <Box
                              key={playerId}
                              px="sm"
                              py="xs"
                              style={{
                                borderBottom:
                                  index === displayedPlayers.length - 1
                                    ? 'none'
                                    : '1px solid var(--mantine-color-gray-2)',
                              }}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={(event) => toggleCopyPlayer(playerId, event.currentTarget.checked)}
                                label={
                                  <Box>
                                    <Text size="sm" fw={650} c="#24291f">
                                      {playerFullName(player, 'Jugador sin nombre')}
                                    </Text>
                                    <Group gap={6} mt={2} align="center">
                                      {player.posicion ? (
                                        <Text size="xs" c="dimmed">
                                          {player.posicion}
                                        </Text>
                                      ) : null}
                                      <Badge size="xs" variant="outline" color="gray" radius="sm">
                                        {player.teamNombre} · {player.teamTemporada}
                                      </Badge>
                                    </Group>
                                  </Box>
                                }
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    </ScrollArea>
                  </Paper>
                </>
              ) : (
                <Paper withBorder radius="md" p="sm" bg="gray.0">
                  <Text size="sm" c="dimmed" style={{ textAlign: 'center' }}>
                    No se encontraron jugadores que coincidan con el filtro actual.
                  </Text>
                </Paper>
              )}
            </Stack>
          </>
        )}
        <Group justify="flex-end" mt="md">
          <Button type="submit" radius="xl" size="xs" loading={saving}>
            {submitLabel}
          </Button>
        </Group>

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
    </form>
  );
}
