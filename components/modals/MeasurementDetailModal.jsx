import React from 'react';
import {
  Modal,
  Group,
  Text,
  Stack,
  Badge,
  Button,
  SimpleGrid,
  Box,
  Table,
  ScrollArea,
  Anchor
} from '@mantine/core';
import { IconEye, IconExternalLink } from '@tabler/icons-react';

export default function MeasurementDetailModal({
  opened,
  onClose,
  detailRow,
  detailMeasurement,
  detailPrevious,
  playerName,
  formatDate,
  sourceRows,
  metricValue,
  deltaFor,
  hasMetricValue,
  metricDisplay,
  deltaColor,
  displayRawValue,
  detailRawEntries,
  METRICS,
  MEASUREMENT_DETAIL_SECTIONS
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconEye size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={700}>
            {detailRow ? `${playerName(detailRow)} · ${formatDate(detailMeasurement?.fecha)}` : 'Detalle de medición'}
          </Text>
        </Group>
      }
      size="xl"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      {detailRow && detailMeasurement && (
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Badge variant="light" color="teal">{detailRow.posicion || 'Sin posición'}</Badge>
              {detailMeasurement.fuente_hoja && <Badge variant="light" color="blue">{detailMeasurement.fuente_hoja}</Badge>}
              {detailMeasurement.fecha_corregida && <Badge variant="light" color="yellow">Fecha corregida</Badge>}
            </Group>
            <Button
              component={Anchor}
              href={`/dashboard/jugador/${detailRow.id}/metricas/mediciones`}
              size="xs"
              radius="xl"
              variant="light"
              leftSection={<IconExternalLink size={14} />}
            >
              Abrir ficha
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={800} mb={6}>Origen</Text>
              <Table variant="simple" verticalSpacing={5}>
                <Table.Tbody>
                  {sourceRows(detailMeasurement).map(([label, value]) => (
                    <Table.Tr key={label}>
                      <Table.Th style={{ width: '48%' }}>{label}</Table.Th>
                      <Table.Td>{value}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>

            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={800} mb={6}>Cambios vs anterior</Text>
              <Table variant="simple" verticalSpacing={5}>
                <Table.Tbody>
                  {METRICS.map((metric) => {
                    const value = metricValue(detailMeasurement, metric);
                    const delta = deltaFor(detailMeasurement, detailPrevious, metric);
                    if (!hasMetricValue(value)) return null;
                    return (
                      <Table.Tr key={metric.key}>
                        <Table.Th>{metric.label}</Table.Th>
                        <Table.Td ta="right" fw={650}>{metricDisplay(value, metric.unit)}</Table.Td>
                        <Table.Td ta="right">
                          {delta !== null && delta !== 0 ? (
                            <Badge color={deltaColor(delta, metric)} variant="light" size="xs">
                              {delta > 0 ? `+${delta}` : delta}
                            </Badge>
                          ) : '-'}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>

            {MEASUREMENT_DETAIL_SECTIONS.map((section) => {
              const sectionRows = section.fields
                .map((field) => ({ ...field, value: metricValue(detailMeasurement, field) }))
                .filter((field) => hasMetricValue(field.value));
              if (!sectionRows.length) return null;

              return (
                <Box key={section.title}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={800} mb={6}>{section.title}</Text>
                  <Table variant="simple" verticalSpacing={5}>
                    <Table.Tbody>
                      {sectionRows.map((field) => (
                        <Table.Tr key={field.key}>
                          <Table.Th style={{ width: '58%' }}>{field.label}</Table.Th>
                          <Table.Td ta="right" fw={650}>{metricDisplay(field.value, field.unit)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
              );
            })}
          </SimpleGrid>

          {detailRawEntries.length > 0 && (
            <Box>
              <Group justify="space-between" align="center" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={800}>Columnas Excel importadas</Text>
                <Badge variant="light" color="gray">{detailRawEntries.length}</Badge>
              </Group>
              <ScrollArea h={280} offsetScrollbars>
                <Table striped highlightOnHover verticalSpacing={5} style={{ minWidth: 620 }}>
                  <Table.Thead bg="gray.0">
                    <Table.Tr>
                      <Table.Th>Campo original</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Valor</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {detailRawEntries.map(([label, value]) => (
                      <Table.Tr key={label}>
                        <Table.Td>{label}</Table.Td>
                        <Table.Td ta="right" fw={650}>{displayRawValue(value)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Box>
          )}
        </Stack>
      )}
    </Modal>
  );
}
