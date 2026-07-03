'use client';

import { useMemo, useState } from 'react';
import { Button, Group, MultiSelect, SegmentedControl, Stack, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/services/message';

export default function MessageComposer({
  players = [],
  defaultRecipientIds = [],
  forceRecipients = false,
  team,
  onSent,
}) {
  const router = useRouter();
  const [mode, setMode] = useState(forceRecipients ? 'selected' : 'all');
  const [recipientIds, setRecipientIds] = useState(defaultRecipientIds.map(String));
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);

  const playerOptions = useMemo(() => players.map((player) => ({
    value: String(player.id),
    label: `${player.nombre || ''} ${player.apellidos || ''}`.trim() || `Jugador ${player.id}`,
  })), [players]);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await sendMessage({
        titulo,
        contenido,
        sendToAll: mode === 'all',
        recipientIds,
        team_id: team?.id,
      });

      notifications.show({
        color: 'green',
        title: 'Mensaje enviado',
        message: mode === 'all' ? 'Disponible para todos los jugadores.' : 'Disponible para los jugadores seleccionados.',
      });
      setTitulo('');
      setContenido('');
      if (!forceRecipients) setRecipientIds([]);
      onSent?.(data.messages || []);
      router.refresh();
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'No se pudo enviar',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedMode = forceRecipients ? 'selected' : mode;

  return (
    <form onSubmit={submit}>
      <Stack gap="sm">
        {!forceRecipients && (
          <SegmentedControl
            value={mode}
            onChange={setMode}
            fullWidth
            radius="xl"
            size="sm"
            bg="gray.1"
            data={[
              { value: 'all', label: 'Todos' },
              { value: 'selected', label: 'Jugadores concretos' },
            ]}
            styles={{
              root: { border: 'none', width: '100%' },
              indicator: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
            }}
          />
        )}

        {selectedMode === 'selected' && (
          <MultiSelect
            label="Destinatarios"
            placeholder="Selecciona jugadores"
            data={playerOptions}
            value={recipientIds}
            onChange={setRecipientIds}
            searchable
            clearable={!forceRecipients}
            variant="filled"
            radius="md"
            required
          />
        )}

        <TextInput
          label="Título"
          placeholder="Ej: Recordatorio de hidratación"
          value={titulo}
          onChange={(event) => setTitulo(event.currentTarget.value)}
          variant="filled"
          radius="md"
          required
        />

        <Textarea
          label="Mensaje"
          placeholder="Escribe el mensaje que verá el jugador..."
          minRows={5}
          autosize
          value={contenido}
          onChange={(event) => setContenido(event.currentTarget.value)}
          variant="filled"
          radius="md"
          required
        />

        <Group justify="flex-end">
          <Button type="submit" loading={loading} size="xs" radius="xl" leftSection={<IconSend size={14} />}>
            Enviar mensaje
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
