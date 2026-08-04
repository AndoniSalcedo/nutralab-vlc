import React from 'react';
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
} from '@mantine/core';
import { playerFullName } from '@/lib/utils';

export default function TeamForm({
  submitTeam,
  form,
  setForm,
  sourceTeamOptions = [],
  createSourceTeamId,
  toggleCreateImport,
  selectCreateSourceTeam,
  isImportingPlayers = false,
  sourceTeam,
  selectedCount = 0,
  copyPlayers = [],
  allCopyPlayersSelected = false,
  someCopyPlayersSelected = false,
  toggleAllCopyPlayers,
  selectedPlayerIds = [],
  toggleCopyPlayer,
  saving = false,
  playerCountLabel,
  modalType,
}) {
  return (
    <form onSubmit={submitTeam}>
      <Stack gap="md">
        <TextInput
          label="Nombre"
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
          value={form.descripcion}
          onChange={(event) => {
            const { value } = event.currentTarget;
            setForm((current) => ({ ...current, descripcion: value }));
          }}
        />
        {modalType === 'create' && sourceTeamOptions.length ? (
          <Paper withBorder radius="md" p="sm" bg={createSourceTeamId ? 'blue.0' : 'gray.0'}>
            <Stack gap="sm">
              <Switch
                label="Copiar jugadores desde otra temporada"
                checked={Boolean(createSourceTeamId)}
                onChange={(event) => toggleCreateImport(event.currentTarget.checked)}
              />
              {createSourceTeamId ? (
                <Select
                  label="Equipo origen"
                  data={sourceTeamOptions}
                  value={createSourceTeamId}
                  onChange={selectCreateSourceTeam}
                  searchable
                  allowDeselect={false}
                />
              ) : null}
            </Stack>
          </Paper>
        ) : null}
        {isImportingPlayers && (
          <>
            <Divider />
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Box>
                  <Text size="sm" fw={800} c="#24291f">
                    Jugadores a importar
                  </Text>
                  <Text size="xs" c="dimmed">
                    {sourceTeam?.nombre} · {sourceTeam?.temporada}
                  </Text>
                </Box>
                <Badge variant="light" color={selectedCount ? 'blue' : 'gray'} radius="sm">
                  {selectedCount}/{copyPlayers.length}
                </Badge>
              </Group>

              {copyPlayers.length ? (
                <>
                  <Checkbox
                    label="Seleccionar toda la plantilla"
                    checked={allCopyPlayersSelected}
                    indeterminate={someCopyPlayersSelected}
                    onChange={(event) => toggleAllCopyPlayers(event.currentTarget.checked)}
                  />
                  <Paper withBorder radius="md" p={0}>
                    <ScrollArea h={Math.min(292, 54 * copyPlayers.length)} offsetScrollbars>
                      <Stack gap={0}>
                        {copyPlayers.map((player, index) => {
                          const playerId = String(player.id);
                          const checked = selectedPlayerIds.includes(playerId);

                          return (
                            <Box
                              key={playerId}
                              px="sm"
                              py="xs"
                              style={{
                                borderBottom:
                                  index === copyPlayers.length - 1
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
                                    {player.posicion ? (
                                      <Text size="xs" c="dimmed">
                                        {player.posicion}
                                      </Text>
                                    ) : null}
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
                  <Text size="sm" c="dimmed">
                    Este equipo no tiene jugadores para importar.
                  </Text>
                </Paper>
              )}
            </Stack>
          </>
        )}
        <Group justify="flex-end">
          <Button type="submit" radius="xl" size="xs" loading={saving}>
            {isImportingPlayers
              ? `Crear equipo${copyPlayers.length ? ` con ${playerCountLabel(selectedCount)}` : ''}`
              : 'Crear equipo'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
