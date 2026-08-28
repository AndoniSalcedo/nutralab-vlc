'use client';

import { useState, useEffect } from 'react';
import { 
  TextInput, 
  Select, 
  Textarea, 
  Button, 
  Group, 
  Stack, 
  SimpleGrid, 
  Title, 
  Text, 
  Box, 
  Checkbox, 
  MultiSelect, 
  NumberInput, 
  Paper, 
  Divider,
  Avatar,
  FileButton,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconUser, IconCheck, IconCamera, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { deletePlayer, savePlayer } from '@/services/player';
import { PLAYER_OBJECTIVES } from '@/lib/calculations';
import { AVAILABLE_MEALS } from '@/lib/nutrition-day-types';
import { compressAvatar, avatarFromRecord, initials as getInitials } from '@/lib/avatar';
import ImageCropModal from '@/components/modals/ImageCropModal';

function dateInputToIso(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PlayerForm({ initial, team }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form states - Foto de perfil
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(() => {
    if (initial?.avatar_url) return initial.avatar_url;
    if (initial?.avatar_size) return `/api/players/avatar?id=${initial.id}&t=${initial.updated_at || ''}`;
    if (typeof initial?.avatar === 'string' && initial.avatar.startsWith('data:')) return initial.avatar;
    return '';
  });
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [tempFileName, setTempFileName] = useState('');

  useEffect(() => {
    if (initial?.avatar && (typeof initial.avatar === 'object' || String(initial.avatar).startsWith('\\x'))) {
      avatarFromRecord(initial.avatar, initial.avatar_mime).then((url) => {
        if (url) setAvatarPreview(url);
      });
    }
  }, [initial]);

  const handleAvatarFileSelected = (file) => {
    if (!file) return;
    setTempFileName(file.name || 'player-avatar.jpg');
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
    setAvatarFile(croppedFile);
    setRemoveAvatar(false);
    const localUrl = URL.createObjectURL(croppedFile);
    setAvatarPreview(localUrl);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setRemoveAvatar(true);
  };

  // Form states - Datos Personales
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [apellidos, setApellidos] = useState(initial?.apellidos ?? '');
  const [posicion, setPosicion] = useState(initial?.posicion ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(
    initial?.fecha_nacimiento ? new Date(`${initial.fecha_nacimiento}T00:00:00`) : null
  );

  // Form states - Pautas Nutricionales
  const [objetivo, setObjetivo] = useState(initial?.objetivo || 'mejora_rendimiento');
  const [numComidas, setNumComidas] = useState(() => {
    if (initial?.num_comidas) {
      return initial.num_comidas.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return ['Desayuno', 'Comida', 'Cena'];
  });
  const [postentreno, setPostentreno] = useState(initial?.postentreno ?? false);

  // Form states - Salud y Preferencias
  const [alergias, setAlergias] = useState(initial?.alergias ?? '');
  const [intolerancias, setIntolerancias] = useState(initial?.intolerancias ?? '');
  const [aversiones, setAversiones] = useState(initial?.aversiones ?? '');
  const [gustos, setGustos] = useState(initial?.gustos_preferencias ?? '');
  const [contexto, setContexto] = useState(initial?.contexto_clinico ?? '');

  // Form states - Mediciones Iniciales (solo al crear)
  const [initialWeight, setInitialWeight] = useState('');
  const [initialHeight, setInitialHeight] = useState('');

  async function handleSubmit(e, isDelete = false) {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      if (initial?.id) {
        formData.append('id', initial.id);
      }
      if (team?.id || initial?.equipo_id) {
        formData.append('team_id', team?.id || initial.equipo_id);
      }

      if (isDelete) {
        await deletePlayer(initial.id);
      } else {
        formData.append('nombre', nombre);
        formData.append('apellidos', apellidos);
        formData.append('posicion', posicion);
        formData.append('fecha_nacimiento', fechaNacimiento ? dateInputToIso(fechaNacimiento) : '');
        formData.append('num_comidas', numComidas.join(', '));
        formData.append('preentreno', 'false');
        formData.append('postentreno', String(postentreno));
        formData.append('gustos_preferencias', gustos);
        formData.append('contexto_clinico', contexto);
        formData.append('aversiones', aversiones);
        formData.append('intolerancias', intolerancias);
        formData.append('alergias', alergias);
        formData.append('objetivo', objetivo);

        if (removeAvatar) {
          formData.append('remove_avatar', 'true');
        } else if (avatarFile instanceof File) {
          const compressed = await compressAvatar(avatarFile);
          formData.append('avatar', compressed);
        }

        if (!initial?.id) {
          if (initialWeight) formData.append('initial_weight', String(initialWeight));
          if (initialHeight) formData.append('initial_height', String(initialHeight));
        }

        await savePlayer(formData);
      }

      notifications.show({
        color: 'green',
        title: isDelete ? 'Jugador eliminado' : 'Jugador guardado',
        message: isDelete ? 'El jugador se ha eliminado correctamente.' : 'Los datos del jugador se han guardado correctamente.',
      });
      router.refresh();
      window.location.reload(); 
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar',
        message: err.message,
      });
      setLoading(false);
    }
  }

  return (
    <Box p="xs">
      <Stack gap="md">
        <div>
          <Title order={3} c="dark.8">{initial ? 'Editar jugador' : 'Añadir jugador'}</Title>
          <Text size="sm" c="dimmed">
            Datos de identidad, rol y contexto nutricional. Las mediciones corporales históricas se gestionan en la pestaña Métricas.
          </Text>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <Stack gap="xl">
            
            {/* Sección 1: Datos Personales y Deportivos */}
            <div>
              <Text fw={700} size="sm" c="blue.8" mb="xs">Datos Personales y Deportivos</Text>
              <Divider mb="md" />

              {/* Avatar Uploader Centrado */}
              <Stack align="center" gap="xs" mb="lg">
                <Box style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={avatarPreview || undefined}
                    size={100}
                    radius="xl"
                    color="blue"
                    style={{
                      border: '3px solid white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      backgroundColor: 'var(--mantine-color-blue-1)',
                      color: 'var(--mantine-color-blue-8)',
                      fontWeight: 700,
                      fontSize: '24px',
                    }}
                  >
                    {getInitials(`${nombre || ''} ${apellidos || ''}`)}
                  </Avatar>

                  <FileButton onChange={handleAvatarFileSelected} accept="image/*">
                    {(props) => (
                      <Tooltip label="Subir foto" position="top" withArrow>
                        <ActionIcon
                          {...props}
                          variant="filled"
                          color="dark"
                          radius="xl"
                          size="md"
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
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

                <ImageCropModal
                  opened={cropModalOpen}
                  onClose={handleCloseCropModal}
                  imageSrc={tempImageSrc}
                  fileName={tempFileName}
                  cropShape="round"
                  title="Ajustar foto de jugador"
                  onCropConfirmed={handleCropConfirmed}
                />

                {avatarPreview && (
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    radius="xl"
                    leftSection={<IconTrash size={13} />}
                    onClick={handleRemoveAvatar}
                  >
                    Eliminar foto
                  </Button>
                )}
              </Stack>

              <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput 
                    label="Nombre"
                    placeholder="Ej. Juan"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    leftSection={<IconUser size={16} />}
                  />
                  <TextInput 
                    label="Apellidos"
                    placeholder="Ej. Pérez"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                  />
                </SimpleGrid>
                
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput 
                    label="Posición"
                    placeholder="Ej. Delantero"
                    value={posicion}
                    onChange={(e) => setPosicion(e.target.value)}
                  />
                  <DateInput
                    label="Fecha de Nacimiento"
                    placeholder="Selecciona fecha..."
                    value={fechaNacimiento}
                    onChange={setFechaNacimiento}
                    clearable
                  />
                </SimpleGrid>
              </Stack>
            </div>

            {/* Sección 2: Pautas Nutricionales */}
            <div>
              <Text fw={700} size="sm" c="blue.8" mb="xs">Pautas Nutricionales</Text>

              <Divider mb="md" />
              <Stack gap="md">
                <Select
                  label="Objetivo Corporal"
                  placeholder="Selecciona un objetivo..."
                  data={PLAYER_OBJECTIVES}
                  value={objetivo || null}
                  onChange={(value) => setObjetivo(value || '')}
                  clearable
                />

                <MultiSelect
                  label="Distribución de comidas por defecto"
                  placeholder="Selecciona comidas..."
                  data={AVAILABLE_MEALS}
                  value={numComidas}
                  onChange={setNumComidas}
                  searchable
                  clearable
                />

                <Group gap="xl" mt="xs">
                  <Checkbox
                    label="Habilitar Post-entreno"
                    checked={postentreno}
                    onChange={(e) => setPostentreno(e.currentTarget.checked)}
                  />
                </Group>

                <Paper withBorder p="sm" radius="md" bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
                  <Text size="xs" fw={700} c="blue.9" mb={2}>Rutina 24h y Día de Partido</Text>
                  <Text size="xs" c="dimmed">
                    Una vez creado o guardado el jugador, podrás configurar sus ingestas específicas pre-partido para partidos por la Mañana, Tarde y Noche desde su ficha individual (pestaña Resumen &gt; Preferencias y contexto).
                  </Text>
                </Paper>
              </Stack>
            </div>

            {/* Sección 3: Salud y Preferencias */}
            <div>
              <Text fw={700} size="sm" c="blue.8" mb="xs">Salud y Preferencias</Text>
              <Divider mb="md" />
              <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                  <Textarea 
                    label="Alergias"
                    placeholder="Ej. Nueces, Mariscos..."
                    rows={3}
                    value={alergias}
                    onChange={(e) => setAlergias(e.target.value)}
                  />
                  <Textarea 
                    label="Intolerancias"
                    placeholder="Ej. Lactosa, Gluten..."
                    rows={3}
                    value={intolerancias}
                    onChange={(e) => setIntolerancias(e.target.value)}
                  />
                  <Textarea 
                    label="Aversiones"
                    placeholder="Alimentos que no le gustan..."
                    rows={3}
                    value={aversiones}
                    onChange={(e) => setAversiones(e.target.value)}
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Textarea 
                    label="Gustos y Preferencias"
                    placeholder="Alimentos preferidos..."
                    rows={3}
                    value={gustos}
                    onChange={(e) => setGustos(e.target.value)}
                  />
                  <Textarea 
                    label="Lesión / Contexto Clínico"
                    placeholder="Ej. Saliendo de esguince de tobillo..."
                    rows={3}
                    value={contexto}
                    onChange={(e) => setContexto(e.target.value)}
                  />
                </SimpleGrid>
              </Stack>
            </div>

            {/* Sección 4: Mediciones Iniciales (solo al crear) */}
            {!initial?.id && (
              <div>
                <Text fw={700} size="sm" c="blue.8" mb="xs">Mediciones Iniciales (Opcional)</Text>
                <Divider mb="md" />
                <Paper withBorder p="md" radius="md" bg="gray.0">
                  <Text size="xs" c="dimmed" mb="md">
                    Introduce el peso y altura iniciales para registrar automáticamente la primera métrica de hoy.
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <NumberInput
                      label="Peso Inicial (kg)"
                      placeholder="Ej. 75.5"
                      min={0}
                      max={300}
                      decimalScale={2}
                      value={initialWeight}
                      onChange={(val) => setInitialWeight(val)}
                    />
                    <NumberInput
                      label="Altura Inicial (cm)"
                      placeholder="Ej. 180"
                      min={0}
                      max={250}
                      decimalScale={1}
                      value={initialHeight}
                      onChange={(val) => setInitialHeight(val)}
                    />
                  </SimpleGrid>
                </Paper>
              </div>
            )}

            {/* Botones de acción */}
            <Group justify="flex-end" mt="md">
              {initial?.id && (
                <Button 
                  color="red" 
                  variant="light" 
                  size="xs"
                  radius="xl"
                  onClick={(e) => handleSubmit(e, true)}
                  loading={loading}
                >
                  Eliminar Jugador
                </Button>
              )}
              <Button 
                type="submit" 
                color="blue"
                size="xs"
                radius="xl"
                loading={loading}
                leftSection={<IconCheck size={16} />}
              >
                Guardar Jugador
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}
