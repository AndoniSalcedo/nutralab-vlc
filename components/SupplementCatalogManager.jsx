'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Box,
  Divider,
  Group,
  Modal,
  LoadingOverlay,
  Paper,
  ThemeIcon,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getSupplementationCatalog, updateSupplementationCatalog } from '@/services/supplement';
import {
  IconBottle,
  IconCalendarStats,
  IconCirclePlus,
  IconInfoCircle,
  IconPencil,
  IconPill,
  IconSearch,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { BentoCard } from '@/components/Bento/BentoItem';

function emptySupplementForm() {
  return {
    nombre: '',
    categoria: '',
    pauta: '',
    timing: '',
    descripcion: '',
    notas: '',
    dose_type: 'custom',
    dose_min: '',
    dose_max: '',
    dose_unit: '',
  };
}

function emptyListForm() {
  return {
    nombre: '',
    descripcion: '',
  };
}

function byId(items) {
  return new Map((items || []).map((item) => [Number(item.id), item]));
}

export default function SupplementCatalogManager({ players = [], team }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ suplementos: [], listas: [], items: [] });
  const [selectedListId, setSelectedListId] = useState('');
  const [selectedSupplementId, setSelectedSupplementId] = useState('');
  const [supplementForm, setSupplementForm] = useState(emptySupplementForm);
  const [listForm, setListForm] = useState(emptyListForm);
  const [editingSupplementId, setEditingSupplementId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

  useEffect(() => {
    if (players?.length) {
      setSelectedPlayerIds(players.map((p) => p.id));
    }
  }, [players]);


  const filteredSupplements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data.suplementos;
    return data.suplementos.filter((supp) =>
      (supp.nombre || '').toLowerCase().includes(query) ||
      (supp.categoria || '').toLowerCase().includes(query)
    );
  }, [data.suplementos, searchQuery]);

  const supplementMap = useMemo(() => byId(data.suplementos), [data.suplementos]);
  const selectedList = data.listas.find((lista) => String(lista.id) === String(selectedListId)) || null;
  const selectedItems = useMemo(
    () => data.items
      .filter((item) => String(item.lista_id) === String(selectedListId))
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0)),
    [data.items, selectedListId]
  );

  const listOptions = data.listas.map((lista) => ({ value: String(lista.id), label: lista.nombre }));
  const supplementOptions = data.suplementos.map((suplemento) => ({ value: String(suplemento.id), label: suplemento.nombre }));

  async function loadData() {
    setLoading(true);
    try {
      const nextData = await getSupplementationCatalog();
      setData(nextData);
      setSelectedListId((current) => current || (nextData.listas?.[0]?.id ? String(nextData.listas[0].id) : ''));
    } catch (err) {
      notifications.show({ color: 'red', title: 'No se pudo cargar', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function postCatalog(payload, successMessage) {
    setSaving(true);
    try {
      const result = await updateSupplementationCatalog(payload);
      notifications.show({ color: 'green', title: 'Suplementación actualizada', message: successMessage });
      await loadData();
      return result;
    } catch (err) {
      notifications.show({ color: 'red', title: 'No se pudo guardar', message: err.message });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function createSupplement() {
    const result = await postCatalog(
      { action: 'create_supplement', ...supplementForm },
      'El suplemento se ha creado en el catálogo global.'
    );
    if (result?.suplemento) {
      setSupplementForm(emptySupplementForm());
      setSelectedSupplementId(String(result.suplemento.id));
    }
  }

  function handleSelectEditSupplement(supp) {
    setEditingSupplementId(supp.id);
    setSupplementForm({
      nombre: supp.nombre || '',
      categoria: supp.categoria || '',
      pauta: supp.pauta || supp.dose_text || '',
      timing: supp.timing || '',
      descripcion: supp.descripcion || '',
      notas: supp.notas || '',
      dose_type: supp.dose_type === 'per_kg_range' ? 'per_kg_range' : 'custom',
      dose_min: supp.dose_min ?? '',
      dose_max: supp.dose_max ?? '',
      dose_unit: supp.dose_unit || '',
    });
  }

  function handleCancelEdit() {
    setEditingSupplementId(null);
    setSupplementForm(emptySupplementForm());
  }

  async function updateSupplement() {
    if (!editingSupplementId) return;

    const result = await postCatalog(
      { action: 'update_supplement', id: Number(editingSupplementId), ...supplementForm },
      'El suplemento se ha actualizado correctamente en el catálogo global.'
    );
    if (result?.suplemento) {
      handleCancelEdit();
    }
  }

  function deleteSupplement(id, name) {
    setConfirmAction({
      message: `¿Estás seguro de que deseas eliminar "${name}" del catálogo global? Se eliminará de todas las asignaciones.`,
      onConfirm: async () => {
        const result = await postCatalog(
          { action: 'delete_supplement', id: Number(id) },
          'El suplemento se ha eliminado del catálogo global.'
        );
        if (result) {
          if (Number(editingSupplementId) === Number(id)) {
            handleCancelEdit();
          }
        }
      },
    });
  }

  async function createList() {
    const result = await postCatalog(
      { action: 'create_list', ...listForm },
      'El catálogo se ha creado correctamente.'
    );
    if (result?.lista) {
      setListForm(emptyListForm());
      setSelectedListId(String(result.lista.id));
    }
  }

  function deleteList(id, name) {
    setConfirmAction({
      message: `¿Estás seguro de que deseas eliminar el catálogo "${name}"? Se eliminará de todas las asignaciones y quitará la relación de los jugadores.`,
      onConfirm: async () => {
        const result = await postCatalog(
          { action: 'delete_list', id: Number(id) },
          'El catálogo se ha eliminado correctamente.'
        );
        if (result) {
          setSelectedListId('');
        }
      },
    });
  }

  async function addSupplementToList() {
    if (!selectedListId || !selectedSupplementId) {
      notifications.show({
        color: 'orange',
        title: 'Falta selección',
        message: 'Selecciona un catálogo y un suplemento.',
      });
      return;
    }

    await postCatalog(
      { action: 'add_item', lista_id: Number(selectedListId), suplemento_id: Number(selectedSupplementId) },
      'El suplemento se ha añadido al catálogo.'
    );
    setSelectedSupplementId('');
  }

  async function removeItem(itemId) {
    await postCatalog(
      { action: 'remove_item', item_id: itemId },
      'El suplemento se ha quitado del catálogo.'
    );
  }

  function assignToSelectedPlayers() {
    if (!selectedListId) {
      notifications.show({ color: 'orange', title: 'Selecciona un catálogo', message: 'Elige un catálogo antes de asignar.' });
      return;
    }
    if (!selectedPlayerIds.length) {
      notifications.show({ color: 'orange', title: 'Selecciona jugadores', message: 'Elige al menos un jugador antes de asignar.' });
      return;
    }

    setConfirmAction({
      message: `¿Asignar "${selectedList?.nombre}" a los ${selectedPlayerIds.length} jugadores seleccionados?`,
      onConfirm: async () => {
        await postCatalog(
          { action: 'assign_to_players', lista_id: Number(selectedListId), team_id: team?.id, jugadorIds: selectedPlayerIds },
          `Catálogo asignado a ${selectedPlayerIds.length} jugadores.`
        );
      },
    });
  }

  return (
    <Stack gap="md" pos="relative">
      <LoadingOverlay visible={loading} />

      <Tabs defaultValue="assign" variant="outline" radius="md" keepMounted={false}>
        <Tabs.List grow>
          <Tabs.Tab value="assign" leftSection={<IconUsers size={15} />}>Asignar</Tabs.Tab>
          <Tabs.Tab value="catalogs" leftSection={<IconBottle size={15} />}>Catálogos</Tabs.Tab>
          <Tabs.Tab value="supplements" leftSection={<IconPill size={15} />}>Suplementos</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="assign" pt="md">
          <BentoCard title="Asignar catálogo a jugadores" icon={IconUsers} color="grape">
            <Group justify="space-between" align="center">
              <Text size="sm" fw={800}>Catálogo de suplementación</Text>
              <Tooltip
                label="Esta acción asignará el catálogo seleccionado a los jugadores marcados en la lista inferior. Los suplementos extras de cada jugador se mantendrán intactos."
                multiline
                w={280}
                withArrow
              >
                <ActionIcon variant="subtle" color="blue" radius="xl" aria-label="Información sobre asignación de catálogo">
                  <IconInfoCircle size={17} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Select
              placeholder="Selecciona catálogo"
              data={listOptions}
              value={selectedListId}
              onChange={(value) => setSelectedListId(value || '')}
              searchable
              variant="filled"
              radius="md"
            />

            <Divider label="Seleccionar destinatarios" labelPosition="center" my="sm" />

            <Group justify="space-between" align="center">
              <Text size="sm" fw={800}>Jugadores ({selectedPlayerIds.length} de {players.length})</Text>
              <Group gap="xs">
                <Button
                  variant="subtle"
                  size="compact-xs"
                  color="grape"
                  onClick={() => setSelectedPlayerIds(players.map((p) => p.id))}
                >
                  Seleccionar todos
                </Button>
                <Button
                  variant="subtle"
                  color="red"
                  size="compact-xs"
                  onClick={() => setSelectedPlayerIds([])}
                >
                  Deseleccionar todos
                </Button>
              </Group>
            </Group>

            <ScrollArea h={180} offsetScrollbars style={{ border: '1px solid var(--mantine-color-gray-2)', borderRadius: 'var(--mantine-radius-md)', padding: '12px', backgroundColor: '#ffffff' }}>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                {players.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  return (
                    <Checkbox
                      key={player.id}
                      label={`${player.nombre} ${player.apellidos || ''}`.trim()}
                      checked={isSelected}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        setSelectedPlayerIds((prev) =>
                          checked
                            ? [...prev, player.id]
                            : prev.filter((id) => id !== player.id)
                        );
                      }}
                      size="sm"
                      color="grape"
                    />
                  );
                })}
              </SimpleGrid>
            </ScrollArea>

            <Group justify="flex-end" mt="xs">
              <Button radius="xl" size="xs" leftSection={<IconUsers size={15} />} onClick={assignToSelectedPlayers} loading={saving}>
                Asignar a jugadores
              </Button>
            </Group>
          </BentoCard>
        </Tabs.Panel>

        <Tabs.Panel value="catalogs" pt="md">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" align="start">
            {/* Left Column: Selector & Creation */}
            <Stack gap="md">
              <BentoCard title="Seleccionar catálogo" icon={IconBottle} color="teal">
                <Select
                  placeholder="Selecciona un catálogo para gestionar"
                  data={listOptions}
                  value={selectedListId}
                  onChange={(value) => setSelectedListId(value || '')}
                  searchable
                  variant="filled"
                  radius="md"
                />

                {selectedList && (
                  <Stack gap="xs" mt="sm">
                    <Text size="xs" fw={700} c="dimmed">DESCRIPCIÓN:</Text>
                    <Text size="sm">
                      {selectedList.descripcion || 'Este catálogo no tiene descripción.'}
                    </Text>
                    <Button
                      size="xs"
                      radius="xl"
                      variant="light"
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => deleteList(selectedList.id, selectedList.nombre)}
                      mt="xs"
                    >
                      Eliminar catálogo
                    </Button>
                  </Stack>
                )}
              </BentoCard>

              <BentoCard title="Crear catálogo" icon={IconCirclePlus} color="blue">
                <TextInput
                  label="Nombre del catálogo"
                  placeholder="Ej. Pretemporada alta carga"
                  value={listForm.nombre}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setListForm((current) => ({ ...current, nombre: val }));
                  }}
                  required
                />
                <Textarea
                  label="Descripción"
                  placeholder="Opcional"
                  minRows={2}
                  value={listForm.descripcion}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setListForm((current) => ({ ...current, descripcion: val }));
                  }}
                />
                <Group justify="flex-end">
                  <Button radius="xl" size="xs" onClick={createList} loading={saving} disabled={!listForm.nombre.trim()}>
                    Crear catálogo
                  </Button>
                </Group>
              </BentoCard>
            </Stack>

            {/* Right Column: Catalog Content and Add Supplement */}
            <Box>
              {selectedList ? (
                <BentoCard title={`Contenido · ${selectedList.nombre}`} icon={IconCalendarStats} color="gray">
                  <Text size="xs" fw={700} c="dimmed">AÑADIR SUPLEMENTO AL CATÁLOGO:</Text>
                  <Group gap="xs" align="flex-end" wrap="nowrap" style={{ width: '100%' }}>
                    <Select
                      placeholder="Selecciona suplemento"
                      data={supplementOptions}
                      value={selectedSupplementId}
                      onChange={(value) => setSelectedSupplementId(value || '')}
                      searchable
                      variant="filled"
                      radius="md"
                      style={{ flex: 1 }}
                    />
                    <Button
                      radius="xl"
                      size="sm"
                      onClick={addSupplementToList}
                      loading={saving}
                      disabled={!selectedSupplementId}
                    >
                      Añadir
                    </Button>
                  </Group>

                  <Divider my="md" label="Suplementos incluidos" labelPosition="center" />

                  {selectedItems.length ? (
                    <ScrollArea h={320}>
                      <Stack gap="xs">
                        {selectedItems.map((item) => {
                          const suplemento = supplementMap.get(Number(item.suplemento_id));
                          return (
                            <Paper key={item.id} p="xs" radius="md" bg="gray.0" withBorder>
                              <Group justify="space-between" wrap="nowrap" align="center">
                                <Stack gap={0} style={{ minWidth: 0 }}>
                                  <Group gap={6} wrap="nowrap">
                                    <Text size="sm" fw={900} truncate>{suplemento?.nombre || 'Suplemento'}</Text>
                                    <Badge size="xs" radius="sm" variant="light" color="gray">{suplemento?.categoria || 'Custom'}</Badge>
                                  </Group>
                                  <Text size="xs" c="dimmed" truncate>{suplemento?.dose_text || suplemento?.pauta || 'Según pauta'}</Text>
                                </Stack>
                                <ActionIcon color="red" variant="subtle" radius="xl" onClick={() => removeItem(item.id)} aria-label="Quitar suplemento">
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </ScrollArea>
                  ) : (
                    <Text size="sm" c="dimmed" style={{ textAlign: 'center' }} py="xl">
                      Este catálogo no tiene suplementos. Añade uno arriba.
                    </Text>
                  )}
                </BentoCard>
              ) : (
                <Paper p="xl" radius="lg" withBorder style={{ textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} bg="gray.0">
                  <ThemeIcon color="gray" variant="light" radius="xl" size="xl" mx="auto" mb="sm">
                    <IconBottle size={24} />
                  </ThemeIcon>
                  <Text fw={800} c="dimmed">Ningún catálogo seleccionado</Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    Selecciona un catálogo en la columna izquierda para gestionar su contenido.
                  </Text>
                </Paper>
              )}
            </Box>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="supplements" pt="md">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" align="start">
            {/* Left Column: Supplements List */}
            <BentoCard title="Catálogo de suplementos" icon={IconPill} color="blue">
              <TextInput
                placeholder="Buscar por nombre o categoría..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                radius="md"
                variant="filled"
              />

              {filteredSupplements.length ? (
                <ScrollArea h={380}>
                  <Stack gap="xs">
                    {filteredSupplements.map((supp) => (
                      <Paper
                        key={supp.id}
                        p="xs"
                        radius="md"
                        bg={editingSupplementId === supp.id ? 'blue.0' : 'gray.0'}
                        style={{ border: editingSupplementId === supp.id ? '1px solid var(--mantine-color-blue-3)' : '1px solid var(--mantine-color-gray-3)' }}
                        withBorder
                      >
                        <Group justify="space-between" wrap="nowrap" align="center">
                          <Stack gap={0} style={{ minWidth: 0 }}>
                            <Group gap={6} wrap="nowrap">
                              <Text size="sm" fw={900} truncate>{supp.nombre}</Text>
                              <Badge size="xs" radius="sm" variant="light" color={editingSupplementId === supp.id ? 'blue' : 'gray'}>
                                {supp.categoria || 'Custom'}
                              </Badge>
                            </Group>
                            <Text size="xs" fw={700} c="teal.7" truncate>{supp.pauta || 'Según pauta'}</Text>
                            <Text size="xs" c="dimmed" truncate>{supp.timing || 'Timing individual'}</Text>
                          </Stack>
                          <Group gap={4} style={{ flexShrink: 0 }}>
                            <ActionIcon
                              color="blue"
                              variant="subtle"
                              radius="xl"
                              onClick={() => handleSelectEditSupplement(supp)}
                              aria-label={`Editar ${supp.nombre}`}
                            >
                              <IconPencil size={16} />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              radius="xl"
                              onClick={() => deleteSupplement(supp.id, supp.nombre)}
                              aria-label={`Eliminar ${supp.nombre}`}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </ScrollArea>
              ) : (
                <Text size="sm" c="dimmed" py="md">No se encontraron suplementos en el catálogo.</Text>
              )}
            </BentoCard>

            {/* Right Column: Create / Edit Form */}
            <BentoCard
              title={editingSupplementId ? `Editar: ${supplementForm.nombre || 'Suplemento'}` : "Crear suplemento"}
              icon={editingSupplementId ? IconPencil : IconCirclePlus}
              color="teal"
            >
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <TextInput
                  label="Nombre"
                  placeholder="Ej. Zinc"
                  value={supplementForm.nombre}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setSupplementForm((current) => ({ ...current, nombre: val }));
                  }}
                  required
                />
                <TextInput
                  label="Categoría"
                  placeholder="Ej. Micronutrientes"
                  value={supplementForm.categoria}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setSupplementForm((current) => ({ ...current, categoria: val }));
                  }}
                />
                <Select
                  label="Tipo de dosificación"
                  data={[
                    { value: 'custom', label: 'Dosis estándar / Texto libre' },
                    { value: 'per_kg_range', label: 'Cálculo por Kg de peso' },
                  ]}
                  value={supplementForm.dose_type}
                  onChange={(value) => setSupplementForm((current) => ({ ...current, dose_type: value || 'custom' }))}
                />
                {supplementForm.dose_type === 'per_kg_range' ? (
                  <Group grow gap="xs">
                    <TextInput
                      label="Mínimo (por kg)"
                      placeholder="Ej. 1"
                      type="number"
                      step="0.1"
                      value={supplementForm.dose_min}
                      onChange={(event) => setSupplementForm((current) => ({ ...current, dose_min: event.currentTarget.value }))}
                    />
                    <TextInput
                      label="Máximo (por kg)"
                      placeholder="Ej. 6"
                      type="number"
                      step="0.1"
                      value={supplementForm.dose_max}
                      onChange={(event) => setSupplementForm((current) => ({ ...current, dose_max: event.currentTarget.value }))}
                    />
                    <TextInput
                      label="Unidad"
                      placeholder="Ej. mg"
                      value={supplementForm.dose_unit}
                      onChange={(event) => setSupplementForm((current) => ({ ...current, dose_unit: event.currentTarget.value }))}
                    />
                  </Group>
                ) : (
                  <TextInput
                    label="Dosis / pauta"
                    placeholder="Ej. 15 mg/día"
                    value={supplementForm.pauta}
                    onChange={(event) => {
                      const val = event.currentTarget.value;
                      setSupplementForm((current) => ({ ...current, pauta: val }));
                    }}
                  />
                )}
                <TextInput
                  label="Timing"
                  placeholder="Ej. Con comida"
                  value={supplementForm.timing}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setSupplementForm((current) => ({ ...current, timing: val }));
                  }}
                />
                <Textarea
                  label="Descripción"
                  placeholder="Para qué se usa"
                  minRows={2}
                  value={supplementForm.descripcion || ''}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setSupplementForm((current) => ({ ...current, descripcion: val }));
                  }}
                />
                <Textarea
                  label="Notas"
                  placeholder="Opcional"
                  minRows={2}
                  value={supplementForm.notas || ''}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setSupplementForm((current) => ({ ...current, notas: val }));
                  }}
                />
              </SimpleGrid>

              <Divider my="sm" />

              <Group justify="flex-end" gap="xs">
                {editingSupplementId && (
                  <Button radius="xl" size="xs" variant="outline" color="gray" onClick={handleCancelEdit}>
                    Cancelar / Nuevo
                  </Button>
                )}
                <Button
                  radius="xl"
                  size="xs"
                  leftSection={editingSupplementId ? <IconPencil size={15} /> : <IconCirclePlus size={15} />}
                  onClick={editingSupplementId ? updateSupplement : createSupplement}
                  loading={saving}
                >
                  {editingSupplementId ? 'Guardar cambios' : 'Crear suplemento'}
                </Button>
              </Group>
            </BentoCard>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      {/* Inline confirmation modal (replaces window.confirm) */}
      <Modal
        opened={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          <Group gap="xs">
            <IconInfoCircle size={20} style={{ color: 'var(--mantine-color-red-6)' }} />
            <Text fw={700}>Confirmar acción</Text>
          </Group>
        }
        size="sm"
        centered
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
        zIndex={1000}
        withCloseButton={false}
      >
        <Stack gap="md">
          <Text size="sm">{confirmAction?.message}</Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              size="xs"
              radius="xl"
              onClick={() => setConfirmAction(null)}
            >
              Cancelar
            </Button>
            <Button
              color="red"
              size="xs"
              radius="xl"
              loading={saving}
              onClick={async () => {
                await confirmAction?.onConfirm?.();
                setConfirmAction(null);
              }}
            >
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
