'use client';

import { useMemo, useState } from 'react';
import { Button, Group, MultiSelect, SegmentedControl, Stack, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function MessageComposer({
  players = [],
  defaultRecipientIds = [],
  forceRecipients = false,
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
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          contenido,
          sendToAll: mode === 'all',
          recipientIds,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar el mensaje');

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
            data={[
              { value: 'all', label: 'Todos' },
              { value: 'selected', label: 'Jugadores concretos' },
            ]}
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
            required
          />
        )}

        <TextInput
          label="Título"
          placeholder="Ej: Recordatorio de hidratación"
          value={titulo}
          onChange={(event) => setTitulo(event.currentTarget.value)}
          required
        />

        <Textarea
          label="Mensaje"
          placeholder="Escribe el mensaje que verá el jugador..."
          minRows={5}
          autosize
          value={contenido}
          onChange={(event) => setContenido(event.currentTarget.value)}
          required
        />

        <Group justify="flex-end">
          <Button type="submit" loading={loading} leftSection={<IconSend size={16} />}>
            Enviar mensaje
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
