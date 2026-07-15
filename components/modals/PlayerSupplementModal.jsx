import React from 'react';
import {
  Modal,
  Group,
  Text,
  Stack,
  SegmentedControl,
  Select,
  TextInput,
  Textarea,
  SimpleGrid,
  Button
} from '@mantine/core';
import { IconBottle, IconPill, IconCirclePlus } from '@tabler/icons-react';

export default function PlayerSupplementModal({
  opened,
  onClose,
  modalMode,
  setModalMode,
  modalTitle,
  data,
  handleListChange,
  saving,
  extraForm,
  setExtraForm,
  handleAddExtra
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          {modalMode === 'lista' ? (
            <IconBottle size={20} style={{ color: 'var(--mantine-color-grape-6)' }} />
          ) : (
            <IconPill size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          )}
          <Text fw={700}>{modalTitle}</Text>
        </Group>
      }
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <SegmentedControl
          value={modalMode}
          onChange={setModalMode}
          data={[
            { value: 'lista', label: 'Catálogo' },
            { value: 'suplemento', label: 'Suplemento' },
          ]}
          fullWidth
        />

        {modalMode === 'lista' ? (
          <Stack gap="md">
            <Stack gap={3}>
              <Text size="sm" fw={900}>Catálogo</Text>
              <Text size="xs" c="dimmed">
                Selecciona el catálogo que generará la suplementación base del jugador.
              </Text>
            </Stack>
            <Select
              label="Catálogo"
              placeholder="Selecciona un catálogo"
              data={data.listas.map((lista) => ({ value: String(lista.id), label: lista.nombre }))}
              value={data.asignacion?.lista_id ? String(data.asignacion.lista_id) : null}
              onChange={handleListChange}
              disabled={saving}
              clearable
              variant="filled"
              radius="md"
            />
          </Stack>
        ) : (
          <Stack gap="md">
            <Stack gap={3}>
              <Text size="sm" fw={900}>Suplemento adicional</Text>
              <Text size="xs" c="dimmed">
                Añade un suplemento fuera del catálogo o personaliza dosis, timing y notas.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Select
                label="Suplemento"
                placeholder="Buscar en catálogo"
                searchable
                data={data.suplementos.map((suplemento) => ({ value: String(suplemento.id), label: suplemento.nombre }))}
                value={extraForm.suplemento_id}
                onChange={(value) => setExtraForm((current) => ({ ...current, suplemento_id: value || '' }))}
                variant="filled"
                radius="md"
              />
              <TextInput
                label="Dosis personalizada"
                placeholder="Opcional, ej. 5 g/día"
                value={extraForm.dose_override}
                onChange={(event) => {
                  const val = event.currentTarget.value;
                  setExtraForm((current) => ({ ...current, dose_override: val }));
                }}
              />
              <TextInput
                label="Timing personalizado"
                placeholder="Opcional, ej. post-entreno"
                value={extraForm.timing_override}
                onChange={(event) => {
                  const val = event.currentTarget.value;
                  setExtraForm((current) => ({ ...current, timing_override: val }));
                }}
              />
              <Textarea
                label="Nota personalizada"
                placeholder="Opcional"
                minRows={2}
                value={extraForm.note_override}
                onChange={(event) => {
                  const val = event.currentTarget.value;
                  setExtraForm((current) => ({ ...current, note_override: val }));
                }}
              />
            </SimpleGrid>

            <Group justify="flex-end">
              <Button radius="xl" size="xs" leftSection={<IconCirclePlus size={15} />} onClick={handleAddExtra} loading={saving}>
                Añadir suplemento
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
