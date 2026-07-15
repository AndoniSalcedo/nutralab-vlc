import React from 'react';
import {
  Modal,
  Stack,
  Tabs,
  Group,
  Text,
  Button,
  FileButton,
  ScrollArea,
  Table,
  Badge,
  Paper
} from '@mantine/core';
import {
  IconDatabaseImport,
  IconDroplet,
  IconFlame,
  IconDownload,
  IconCheck
} from '@tabler/icons-react';

export default function ImportCsvModal({
  opened,
  onClose,
  importKind,
  setImportKind,
  allImportRows,
  setAllImportRows,
  previewRows,
  setPreviewRows,
  downloadTemplate,
  handleFileChange,
  triggerImport,
  importing,
  getCsvVal,
  getRecordStatusConfig
}) {
  return (
    <Modal
      opened={opened}
      onClose={() => {
        onClose();
        setAllImportRows([]);
        setPreviewRows([]);
      }}
      title={
        <Group gap="xs">
          <IconDatabaseImport size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={700}>Añadir datos</Text>
        </Group>
      }
      size="xl"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <Tabs
          value={importKind}
          onChange={(value) => {
            setImportKind(value || 'hydration');
            setAllImportRows([]);
            setPreviewRows([]);
          }}
          variant="outline"
          radius="md"
        >
          <Tabs.List grow>
            <Tabs.Tab value="hydration" leftSection={<IconDroplet size={15} />}>
              Hidratación
            </Tabs.Tab>
            <Tabs.Tab value="sweat" leftSection={<IconFlame size={15} />}>
              Sudoración
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="hydration" pt="md">
            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="sm" c="dimmed">Carga un CSV de osmolaridad salival.</Text>
              <Group gap="xs">
                <Button
                  onClick={() => downloadTemplate('hydration')}
                  leftSection={<IconDownload size={14} />}
                  variant="outline"
                  color="blue"
                  radius="xl"
                  size="xs"
                >
                  Descargar plantilla
                </Button>
                <FileButton onChange={(file) => handleFileChange(file, 'hydration')} accept=".csv">
                  {(props) => (
                    <Button {...props} leftSection={<IconDatabaseImport size={16} />} color="blue" radius="xl" size="xs">
                      Seleccionar CSV
                    </Button>
                  )}
                </FileButton>
              </Group>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="sweat" pt="md">
            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="sm" c="dimmed">Carga un CSV de sodio en sudor.</Text>
              <Group gap="xs">
                <Button
                  onClick={() => downloadTemplate('sweat')}
                  leftSection={<IconDownload size={14} />}
                  variant="outline"
                  color="orange"
                  radius="xl"
                  size="xs"
                >
                  Descargar plantilla
                </Button>
                <FileButton onChange={(file) => handleFileChange(file, 'sweat')} accept=".csv">
                  {(props) => (
                    <Button {...props} leftSection={<IconDatabaseImport size={16} />} color="orange" radius="xl" size="xs">
                      Seleccionar CSV
                    </Button>
                  )}
                </FileButton>
              </Group>
            </Group>
          </Tabs.Panel>
        </Tabs>

        {allImportRows.length > 0 ? (
          <>
            <Text size="xs" fw={700} c="dimmed">
              Vista previa de los primeros {previewRows.length} registros (Total: {allImportRows.length}):
            </Text>

            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ fontSize: 10 }}>Fecha</Table.Th>
                    <Table.Th style={{ fontSize: 10 }}>Hora</Table.Th>
                    <Table.Th style={{ fontSize: 10 }}>Tipo</Table.Th>
                    <Table.Th style={{ fontSize: 10, textAlign: 'right' }}>Valor</Table.Th>
                    <Table.Th style={{ fontSize: 10 }}>Unidad</Table.Th>
                    <Table.Th style={{ fontSize: 10 }}>Estado</Table.Th>
                    <Table.Th style={{ fontSize: 10 }}>Notas</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {previewRows.map((r, i) => {
                    const rawDate = getCsvVal(r, ['Date', 'fecha', 'dia', 'measurement date']);
                    const rawTime = getCsvVal(r, ['Time', 'hora']);
                    const rawType = getCsvVal(r, ['Type', 'tipo']);
                    const rawVal = getCsvVal(r, ['Value', 'valor', 'sosm', 'osmolarity', 'osmolaridad']);
                    const rawUnit = getCsvVal(r, ['Unit', 'unidad']);
                    const rawStatus = getCsvVal(r, ['Status', 'estado']);
                    const rawNotes = getCsvVal(r, ['Notes', 'notas']);

                    const cfg = getRecordStatusConfig(rawStatus, rawType);

                    return (
                      <Table.Tr key={i}>
                        <Table.Td style={{ fontSize: 10 }}>{rawDate}</Table.Td>
                        <Table.Td style={{ fontSize: 10 }}>{rawTime || '-'}</Table.Td>
                        <Table.Td style={{ fontSize: 10 }}>
                          <Badge size="xs" color="gray" variant="outline">{rawType || 'sosm'}</Badge>
                        </Table.Td>
                        <Table.Td style={{ fontSize: 10, fontWeight: 700, textAlign: 'right' }}>{rawVal}</Table.Td>
                        <Table.Td style={{ fontSize: 10 }}>{rawUnit || (String(rawType).toLowerCase() === 'sweat' ? 'mg/L' : 'mOsm')}</Table.Td>
                        <Table.Td style={{ fontSize: 10 }}>
                          <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }} size="xs">
                            {cfg.label}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rawNotes || '-'}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </>
        ) : (
          <Paper p="md" radius="md" bg="gray.0" withBorder>
            <Text size="sm" fw={700}>
              Selecciona un CSV desde la pestaña {importKind === 'sweat' ? 'Sudoración' : 'Hidratación'}.
            </Text>
          </Paper>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="light" color="gray" radius="xl" size="xs" onClick={onClose} disabled={importing}>
            Cancelar
          </Button>
          <Button
            color="blue"
            radius="xl"
            size="xs"
            leftSection={<IconCheck size={16} />}
            onClick={triggerImport}
            loading={importing}
            disabled={allImportRows.length === 0}
          >
            Confirmar e Importar {allImportRows.length} Registros
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
