'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Group,
  Text,
  Stack,
  TextInput,
  Button,
  ScrollArea,
  Avatar,
  Box,
  Divider,
  Tabs,
  Checkbox,
  Paper,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconScale,
  IconCalendar,
  IconSearch,
  IconCheck,
  IconDownload,
  IconFileSpreadsheet,
  IconFileTypePdf,
} from '@tabler/icons-react';
import { savePesaje } from '@/services/pesaje';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { initials } from '@/lib/utils';
import { calculateSemaforo } from '@/lib/player-metrics';
import {
  formatFullDate,
  dateToIso,
  exportWeightExcel,
  downloadWeightPdf,
} from '@/lib/weight-export';

export default function SquadWeightModal({ opened, onClose, players = [], team }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('record');

  // Tab 1: Registrar peso
  const [date, setDate] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [weights, setWeights] = useState({});
  const [saving, setSaving] = useState(false);
  const [localOverrides, setLocalOverrides] = useState({});

  // Tab 2: Exportar peso
  const [exportDate, setExportDate] = useState(() => new Date());
  const [exportSearch, setExportSearch] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(() => new Set());
  const [exportingPdf, setExportingPdf] = useState(false);

  const normalizeDate = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    return dateToIso(d);
  };

  // Filter players for "Registrar peso" tab
  const filteredPlayers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return players;
    return players.filter((p) => {
      const fullName = `${p.nombre || ''} ${p.apellidos || ''}`.toLowerCase();
      return fullName.includes(q);
    });
  }, [players, search]);

  // Compute player weights and semáforo for "Exportar peso" tab
  const exportDateIso = normalizeDate(exportDate);

  const preparedExportPlayers = useMemo(() => {
    return players.map((player) => {
      const pPesajes = [...(player.pesajes || [])];

      // Check if there is an in-memory override from recent save
      const overrideVal = localOverrides[`${player.id}_${exportDateIso}`];

      let pesajeOnDate = pPesajes.find(
        (p) => normalizeDate(p.fecha) === exportDateIso
      );

      if (overrideVal !== undefined) {
        pesajeOnDate = { fecha: exportDateIso, peso_kg: overrideVal };
        // Add to pesajes if not present
        if (!pPesajes.some((p) => normalizeDate(p.fecha) === exportDateIso)) {
          pPesajes.push(pesajeOnDate);
        }
      }

      const hasWeight = Boolean(
        pesajeOnDate &&
          pesajeOnDate.peso_kg !== null &&
          pesajeOnDate.peso_kg !== undefined &&
          pesajeOnDate.peso_kg !== ''
      );
      const pesoVal = hasWeight ? Number(pesajeOnDate.peso_kg) : null;

      const calcOptions = {
        masaMagra: player.peso_magro || player.masa_magra_kg,
        porcentajeGrasaObjetivo: player.porcentaje_grasa_objetivo,
        evoluciones: player.evoluciones,
        jugador: player,
      };

      let semaforo;
      if (hasWeight) {
        semaforo = calculateSemaforo(pPesajes, pesoVal, calcOptions);
      } else {
        const refCalc = calculateSemaforo(pPesajes, null, calcOptions);
        semaforo = {
          hasPesajes: false,
          pesoReferencia: refCalc.pesoReferencia,
          pesoActual: null,
          diff: null,
          absDiff: null,
          status: 'sin_registro',
          color: 'gray',
          label: 'Sin registro',
        };
      }

      let dotColor = '#94a3b8';
      let textColor = '#64748b';
      let title = 'Sin registro';

      if (hasWeight) {
        if (semaforo.status === 'verde') {
          dotColor = '#16a34a';
          textColor = '#15803d';
          title = 'Óptimo';
        } else if (semaforo.status === 'amarillo') {
          dotColor = '#f59e0b';
          textColor = '#b45309';
          title = 'Precaución';
        } else if (semaforo.status === 'rojo') {
          dotColor = '#ef4444';
          textColor = '#b91c1c';
          title = semaforo.diff < 0 ? 'Alerta (Pérdida)' : 'Alerta (Exceso)';
        }
      }

      const masaMagra = semaforo.masaMagra || player.peso_magro || player.masa_magra_kg;
      const targetFatPct = Number(player.porcentaje_grasa_objetivo) || 10;

      const peso8 = masaMagra && Number.isFinite(masaMagra) && masaMagra > 0
        ? Math.round((masaMagra / 0.92) * 100) / 100
        : null;
      const peso9 = masaMagra && Number.isFinite(masaMagra) && masaMagra > 0
        ? Math.round((masaMagra / 0.91) * 100) / 100
        : null;
      const peso10 = masaMagra && Number.isFinite(masaMagra) && masaMagra > 0
        ? Math.round((masaMagra / 0.90) * 100) / 100
        : null;

      return {
        ...player,
        hasWeight,
        peso: pesoVal,
        pesoReferencia: semaforo.pesoReferencia,
        porcentajeGrasaObjetivo: targetFatPct,
        masaMagra,
        peso8,
        peso9,
        peso10,
        diff: semaforo.diff,
        status: semaforo.status,
        statusTitle: title,
        dotColor,
        textColor,
      };
    });
  }, [players, exportDateIso, localOverrides]);

  // Filter players for Export tab search
  const filteredExportPlayers = useMemo(() => {
    const q = exportSearch.toLowerCase().trim();
    if (!q) return preparedExportPlayers;
    return preparedExportPlayers.filter((p) => {
      const fullName = `${p.nombre || ''} ${p.apellidos || ''}`.toLowerCase();
      const pos = (p.posicion || '').toLowerCase();
      return fullName.includes(q) || pos.includes(q);
    });
  }, [preparedExportPlayers, exportSearch]);

  // Sync selection when export date or modal opens
  useEffect(() => {
    if (opened) {
      const withWeight = preparedExportPlayers.filter((p) => p.hasWeight);
      if (withWeight.length > 0) {
        setSelectedPlayerIds(new Set(withWeight.map((p) => String(p.id))));
      } else {
        setSelectedPlayerIds(new Set(preparedExportPlayers.map((p) => String(p.id))));
      }
    }
  }, [opened, exportDateIso, preparedExportPlayers]);

  // Export summary stats
  const exportSummary = useMemo(() => {
    const selected = preparedExportPlayers.filter((p) =>
      selectedPlayerIds.has(String(p.id))
    );
    const optimo = selected.filter((p) => p.status === 'verde').length;
    const precaucion = selected.filter((p) => p.status === 'amarillo').length;
    const alerta = selected.filter((p) => p.status === 'rojo').length;
    const conPeso = selected.filter((p) => p.hasWeight).length;

    return {
      total: selected.length,
      conPeso,
      optimo,
      precaucion,
      alerta,
    };
  }, [preparedExportPlayers, selectedPlayerIds]);

  function handleSelectAll() {
    setSelectedPlayerIds(new Set(preparedExportPlayers.map((p) => String(p.id))));
  }

  function handleDeselectAll() {
    setSelectedPlayerIds(new Set());
  }

  function handleSelectOnlyWithWeight() {
    const withWeight = preparedExportPlayers.filter((p) => p.hasWeight);
    setSelectedPlayerIds(new Set(withWeight.map((p) => String(p.id))));
  }

  function togglePlayer(id) {
    const strId = String(id);
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(strId)) {
        next.delete(strId);
      } else {
        next.add(strId);
      }
      return next;
    });
  }

  async function handleSave() {
    const entries = Object.entries(weights)
      .map(([playerId, val]) => ({ playerId, value: val.trim() }))
      .filter((e) => e.value !== '');

    if (entries.length === 0) {
      notifications.show({
        color: 'yellow',
        title: 'Atención',
        message: 'No has introducido el peso de ningún jugador.',
      });
      return;
    }

    for (const entry of entries) {
      const val = Number(entry.value);
      if (isNaN(val) || val <= 0) {
        const player = players.find((p) => String(p.id) === String(entry.playerId));
        const name = player ? `${player.nombre} ${player.apellidos || ''}` : 'Jugador';
        notifications.show({
          color: 'red',
          title: 'Error de validación',
          message: `El peso introducido para ${name} no es un número válido.`,
        });
        return;
      }
    }

    setSaving(true);
    const dateStr = dateToIso(date);

    try {
      const promises = entries.map((entry) =>
        savePesaje({
          jugador_id: entry.playerId,
          fecha: dateStr,
          peso_kg: parseFloat(entry.value),
        })
      );

      await Promise.all(promises);

      // Save local overrides for immediate export tab view
      setLocalOverrides((prev) => {
        const next = { ...prev };
        entries.forEach((e) => {
          next[`${e.playerId}_${dateStr}`] = parseFloat(e.value);
        });
        return next;
      });

      notifications.show({
        color: 'green',
        title: 'Pesos registrados',
        message: `Se han guardado las métricas de peso para ${entries.length} jugadores.`,
      });

      setWeights({});
      setSearch('');
      onClose();
      router.refresh();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al guardar pesos',
        message: err.message || 'Ocurrió un error inesperado al registrar los pesos.',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleExportExcel() {
    const selectedList = preparedExportPlayers.filter((p) =>
      selectedPlayerIds.has(String(p.id))
    );
    if (selectedList.length === 0) {
      notifications.show({
        color: 'yellow',
        title: 'Atención',
        message: 'Selecciona al menos un jugador para exportar.',
      });
      return;
    }

    exportWeightExcel({
      teamName: team?.nombre || 'Plantilla',
      fecha: dateToIso(exportDate),
      fechaFormatted: formatFullDate(exportDate),
      records: selectedList,
      summary: exportSummary,
    });

    notifications.show({
      color: 'green',
      title: 'Excel generado',
      message: `Se ha descargado el archivo Excel con ${selectedList.length} jugadores.`,
    });
  }

  async function handleExportPdf() {
    const selectedList = preparedExportPlayers.filter((p) =>
      selectedPlayerIds.has(String(p.id))
    );
    if (selectedList.length === 0) {
      notifications.show({
        color: 'yellow',
        title: 'Atención',
        message: 'Selecciona al menos un jugador para exportar.',
      });
      return;
    }

    setExportingPdf(true);
    try {
      await downloadWeightPdf({
        teamName: team?.nombre || 'Plantilla',
        fecha: dateToIso(exportDate),
        fechaFormatted: formatFullDate(exportDate),
        records: selectedList,
        summary: exportSummary,
      });

      notifications.show({
        color: 'green',
        title: 'PDF generado',
        message: `Se ha descargado el informe de pesajes con ${selectedList.length} jugadores.`,
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al exportar PDF',
        message: err.message || 'Ocurrió un error al generar el PDF.',
      });
    } finally {
      setExportingPdf(false);
    }
  }

  const playersWithWeightCount = preparedExportPlayers.filter((p) => p.hasWeight).length;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconScale size={22} style={{ color: 'var(--mantine-color-orange-6)' }} />
          <Text fw={800} size="lg">
            Control de pesaje del equipo
          </Text>
        </Group>
      }
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="outline"
        radius="md"
        color="orange"
      >
        <Tabs.List grow mb="md">
          <Tabs.Tab value="record" leftSection={<IconScale size={16} />}>
            Registrar peso
          </Tabs.Tab>
          <Tabs.Tab value="export" leftSection={<IconDownload size={16} />}>
            Exportar peso
          </Tabs.Tab>
        </Tabs.List>

        {/* TAB 1: REGISTRAR PESO */}
        <Tabs.Panel value="record">
          <Stack gap="md">
            <DateInput
              label="Fecha de medición"
              required
              value={date}
              onChange={(value) => value && setDate(value)}
              placeholder="Selecciona la fecha"
              valueFormat="DD/MM/YYYY"
              leftSection={<IconCalendar size={16} />}
              radius="md"
            />

            <TextInput
              placeholder="Buscar jugador..."
              leftSection={<IconSearch size={16} style={{ opacity: 0.7 }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              radius="md"
              variant="filled"
            />

            <Divider label="Lista de Jugadores" labelPosition="center" />

            <ScrollArea.Autosize mah="42vh" offsetScrollbars>
              <Stack gap="xs" pr="xs">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => {
                    const fullName = `${player.nombre} ${player.apellidos || ''}`.trim();
                    const pesoActual = player.peso_kg;
                    return (
                      <Group
                        key={player.id}
                        justify="space-between"
                        align="center"
                        wrap="nowrap"
                        py={4}
                        px={4}
                      >
                        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                          <Avatar
                            src={
                              player.avatar_url ||
                              (player.avatar_size
                                ? `/api/players/avatar?id=${player.id}`
                                : undefined)
                            }
                            size={36}
                            radius="xl"
                            color="initials"
                          >
                            {initials(fullName)}
                          </Avatar>

                          <Box style={{ minWidth: 0 }}>
                            <Text size="sm" fw={600} truncate c="dark.4">
                              {fullName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {pesoActual
                                ? `Último: ${pesoActual} kg`
                                : 'Sin peso registrado'}
                            </Text>
                          </Box>
                        </Group>

                        <TextInput
                          placeholder="kg"
                          type="number"
                          step="any"
                          min={0}
                          w={90}
                          radius="md"
                          value={weights[player.id] ?? ''}
                          onChange={(e) =>
                            setWeights({ ...weights, [player.id]: e.target.value })
                          }
                          styles={{
                            input: { textAlign: 'right' },
                          }}
                        />
                      </Group>
                    );
                  })
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="lg">
                    No se encontraron jugadores.
                  </Text>
                )}
              </Stack>
            </ScrollArea.Autosize>

            <Divider />

            <Group justify="flex-end" mt="xs">
              <Button
                size="xs"
                radius="xl"
                variant="subtle"
                color="gray"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                size="xs"
                radius="xl"
                color="orange"
                leftSection={<IconCheck size={16} />}
                onClick={handleSave}
                loading={saving}
              >
                Guardar pesos
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        {/* TAB 2: EXPORTAR PESO */}
        <Tabs.Panel value="export">
          <Stack gap="sm">
            <Group grow align="flex-end">
              <DateInput
                label="Fecha de la toma de peso"
                required
                value={exportDate}
                onChange={(value) => value && setExportDate(value)}
                placeholder="Selecciona la fecha"
                valueFormat="DD/MM/YYYY"
                leftSection={<IconCalendar size={16} />}
                radius="md"
              />

              <TextInput
                label="Buscar en la plantilla"
                placeholder="Nombre o posición..."
                leftSection={<IconSearch size={16} style={{ opacity: 0.7 }} />}
                value={exportSearch}
                onChange={(e) => setExportSearch(e.target.value)}
                radius="md"
              />
            </Group>

            {/* Summary KPI Strip */}
            <Paper
              p="xs"
              radius="md"
              style={{
                backgroundColor: 'var(--mantine-color-gray-0)',
                border: '1px solid var(--mantine-color-gray-2)',
              }}
            >
              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <Group gap="lg">
                  <Group gap={6}>
                    <Box
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                      }}
                    />
                    <Text size="xs" fw={700} c="#15803d">
                      {exportSummary.optimo} Óptimo
                    </Text>
                  </Group>

                  <Group gap={6}>
                    <Box
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: '#f59e0b',
                      }}
                    />
                    <Text size="xs" fw={700} c="#b45309">
                      {exportSummary.precaucion} Precaución
                    </Text>
                  </Group>

                  <Group gap={6}>
                    <Box
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                      }}
                    />
                    <Text size="xs" fw={700} c="#b91c1c">
                      {exportSummary.alerta} Alerta
                    </Text>
                  </Group>
                </Group>

                <Text size="xs" c="dimmed">
                  Con peso:{' '}
                  <span style={{ fontWeight: 700, color: 'var(--mantine-color-dark-4)' }}>
                    {exportSummary.conPeso}
                  </span>{' '}
                  / {exportSummary.total} seleccionados
                </Text>
              </Group>
            </Paper>

            {/* Quick Actions Bar */}
            <Group justify="space-between" align="center">
              <Group gap={6}>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                  onClick={handleSelectAll}
                >
                  Todos ({players.length})
                </Button>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                  onClick={handleDeselectAll}
                >
                  Deseleccionar
                </Button>
                <Button
                  size="compact-xs"
                  variant="light"
                  color="orange"
                  onClick={handleSelectOnlyWithWeight}
                  disabled={playersWithWeightCount === 0}
                >
                  Solo con peso ({playersWithWeightCount})
                </Button>
              </Group>

              <Text size="xs" c="dimmed">
                {selectedPlayerIds.size} seleccionados
              </Text>
            </Group>

            <Divider />

            {/* Players List with clean typography and status dots (NO Mantine Badges as per rules) */}
            <ScrollArea.Autosize mah="38vh" offsetScrollbars>
              <Stack gap={4} pr="xs">
                {filteredExportPlayers.length > 0 ? (
                  filteredExportPlayers.map((player) => {
                    const fullName = `${player.nombre} ${player.apellidos || ''}`.trim();
                    const isSelected = selectedPlayerIds.has(String(player.id));
                    const hasWeight = player.hasWeight;

                    const formattedDiff =
                      player.diff !== null && player.diff !== undefined
                        ? player.diff > 0
                          ? `+${player.diff.toFixed(2)} kg`
                          : `${player.diff.toFixed(2)} kg`
                        : '—';

                    return (
                      <Group
                        key={player.id}
                        justify="space-between"
                        align="center"
                        wrap="nowrap"
                        py={6}
                        px={8}
                        style={{
                          borderRadius: 8,
                          backgroundColor: isSelected
                            ? 'var(--mantine-color-gray-0)'
                            : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s ease',
                          border: isSelected
                            ? '1px solid var(--mantine-color-gray-3)'
                            : '1px solid transparent',
                        }}
                        onClick={() => togglePlayer(player.id)}
                      >
                        {/* Player info with Checkbox */}
                        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => togglePlayer(player.id)}
                            onClick={(e) => e.stopPropagation()}
                            color="orange"
                            size="sm"
                          />
                          <Avatar
                            src={
                              player.avatar_url ||
                              (player.avatar_size
                                ? `/api/players/avatar?id=${player.id}`
                                : undefined)
                            }
                            size={34}
                            radius="xl"
                            color="initials"
                          >
                            {initials(fullName)}
                          </Avatar>

                          <Box style={{ minWidth: 0 }}>
                            <Text size="sm" fw={600} truncate c="dark.4">
                              {fullName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {player.posicion || 'Sin posición'}
                            </Text>
                          </Box>
                        </Group>

                        {/* Weight and Reference */}
                        <Box style={{ textAlign: 'right', minWidth: 80 }}>
                          {hasWeight ? (
                            <Text size="sm" fw={700} c="dark.5">
                              {player.peso} kg
                            </Text>
                          ) : (
                            <Text size="xs" c="dimmed" fs="italic">
                              Sin registro
                            </Text>
                          )}
                          <Text size="10px" c="dimmed">
                            Ref: {player.pesoReferencia ? `${player.pesoReferencia} kg` : '—'}
                          </Text>
                        </Box>

                        {/* Semáforo status (subtle dot + crisp text, strictly NO Badge) */}
                        <Box style={{ minWidth: 115, textAlign: 'right' }}>
                          {hasWeight ? (
                            <>
                              <Group gap={5} justify="flex-end" wrap="nowrap">
                                <Box
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    backgroundColor: player.dotColor,
                                    boxShadow: `0 0 5px ${player.dotColor}`,
                                    flexShrink: 0,
                                  }}
                                />
                                <Text
                                  size="xs"
                                  fw={700}
                                  style={{ color: player.textColor }}
                                >
                                  {formattedDiff}
                                </Text>
                              </Group>
                              <Text
                                size="10px"
                                fw={600}
                                style={{ color: player.textColor }}
                              >
                                {player.statusTitle}
                              </Text>
                            </>
                          ) : (
                            <Group gap={5} justify="flex-end" wrap="nowrap">
                              <Box
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: '#94a3b8',
                                  flexShrink: 0,
                                }}
                              />
                              <Text size="xs" c="dimmed" fs="italic">
                                Sin pesaje
                              </Text>
                            </Group>
                          )}
                        </Box>
                      </Group>
                    );
                  })
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="lg">
                    No se encontraron jugadores que coincidan con la búsqueda.
                  </Text>
                )}
              </Stack>
            </ScrollArea.Autosize>

            <Divider />

            {/* Bottom Export Action Bar */}
            <Group justify="space-between" align="center" mt="xs">
              <Button
                size="xs"
                radius="xl"
                variant="subtle"
                color="gray"
                onClick={onClose}
              >
                Cerrar
              </Button>

              <Group gap="xs">
                <Button
                  size="xs"
                  radius="xl"
                  color="teal"
                  variant="light"
                  leftSection={<IconFileSpreadsheet size={16} />}
                  onClick={handleExportExcel}
                  disabled={selectedPlayerIds.size === 0}
                >
                  Exportar Excel
                </Button>

                <Button
                  size="xs"
                  radius="xl"
                  color="orange"
                  leftSection={<IconFileTypePdf size={16} />}
                  onClick={handleExportPdf}
                  loading={exportingPdf}
                  disabled={selectedPlayerIds.size === 0}
                >
                  Exportar PDF
                </Button>
              </Group>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
