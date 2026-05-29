'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  LoadingOverlay,
  Paper,
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

  // Inline confirmation system (replaces window.confirm which is incompatible with Mantine Modal)
  const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }


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
      const res = await fetch('/api/supplementation/catalog');
      const nextData = await res.json();
      if (!res.ok) throw new Error(nextData.error || 'No se pudo cargar suplementación');
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
      const res = await fetch('/api/supplementation/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'No se pudo guardar');
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
      pauta: supp.pauta || '',
      timing: supp.timing || '',
      descripcion: supp.descripcion || '',
      notas: supp.notas || '',
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

  function assignAll() {
    if (!selectedListId) {
      notifications.show({ color: 'orange', title: 'Selecciona un catálogo', message: 'Elige un catálogo antes de asignar.' });
      return;
    }

    setConfirmAction({
      message: `¿Asignar "${selectedList?.nombre}" a ${players.length} jugadores?`,
      onConfirm: async () => {
        await postCatalog(
          { action: 'assign_all', lista_id: Number(selectedListId), team_id: team?.id },
          `Catálogo asignado a ${players.length} jugadores.`
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
          <BentoCard title="Asignación global" icon={IconUsers} color="grape">
            <Group justify="space-between" align="center">
              <Text size="sm" fw={800}>Catálogo para toda la plantilla</Text>
              <Tooltip
                label="Esta acción asigna el catálogo seleccionado a todos los jugadores. Los extras individuales de cada jugador se mantienen."
                multiline
                w={280}
                withArrow
              >
                <ActionIcon variant="subtle" color="blue" radius="xl" aria-label="Información sobre asignación global">
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
            />
            <Group justify="flex-end">
              <Button radius="xl" size="xs" leftSection={<IconUsers size={15} />} onClick={assignAll} loading={saving}>
                Asignar a todos
              </Button>
            </Group>
          </BentoCard>
        </Tabs.Panel>

        <Tabs.Panel value="catalogs" pt="md">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <BentoCard title="Crear catálogo" icon={IconCirclePlus} color="blue">
              <TextInput
                label="Nombre"
                placeholder="Ej. Pretemporada alta carga"
                value={listForm.nombre}
                onChange={(event) => {
                  const val = event.currentTarget.value;
                  setListForm((current) => ({ ...current, nombre: val }));
                }}
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
                <Button radius="xl" size="xs" onClick={createList} loading={saving}>
                  Crear catálogo
                </Button>
              </Group>
            </BentoCard>

            <BentoCard title="Añadir suplemento" icon={IconBottle} color="teal">
              <Select
                label="Catálogo"
                data={listOptions}
                value={selectedListId}
                onChange={(value) => setSelectedListId(value || '')}
                searchable
              />
              <Select
                label="Suplemento"
                placeholder="Selecciona suplemento"
                data={supplementOptions}
                value={selectedSupplementId}
                onChange={(value) => setSelectedSupplementId(value || '')}
                searchable
              />
              <Group justify="flex-end">
                <Button radius="xl" size="xs" leftSection={<IconCirclePlus size={15} />} onClick={addSupplementToList} loading={saving}>
                  Añadir al catálogo
                </Button>
              </Group>
            </BentoCard>
          </SimpleGrid>

          <BentoCard title={selectedList ? `Contenido · ${selectedList.nombre}` : 'Contenido'} icon={IconCalendarStats} color="gray" mt="md">
            {selectedItems.length ? (
              <ScrollArea h={260}>
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
              <Text size="sm" c="dimmed">Selecciona un catálogo o añade suplementos para ver su contenido.</Text>
            )}
          </BentoCard>
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
                <TextInput
                  label="Dosis / pauta"
                  placeholder="Ej. 15 mg/día"
                  value={supplementForm.pauta}
                  onChange={(event) => {
                    const val = event.currentTarget.value;
                    setSupplementForm((current) => ({ ...current, pauta: val }));
                  }}
                />
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
        title="Confirmar acción"
        size="sm"
        centered
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
