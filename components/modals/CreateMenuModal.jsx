import React from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  Divider,
  Grid,
  Paper,
  ThemeIcon,
  FileButton,
  Button
} from '@mantine/core';
import { IconCalendar, IconUpload, IconEdit } from '@tabler/icons-react';

export default function CreateMenuModal({
  opened,
  onClose,
  weekDate,
  setWeekDate,
  handleUploadFile,
  handleCreateEmptyMenu,
  uploading,
  creatingEmpty
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={850} size="lg" c="dark.4">
          Nuevo Menú Semanal
        </Text>
      }
      centered
      radius="lg"
      size="lg"
      styles={{
        header: {
          borderBottom: '1px solid var(--mantine-color-gray-1)',
          paddingBottom: 'var(--mantine-spacing-sm)',
          marginBottom: 'var(--mantine-spacing-md)',
        }
      }}
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed" lh={1.3}>
          Selecciona la fecha del lunes de la semana correspondiente. Después, puedes subir una imagen/PDF para que la IA extraiga los platos, o bien crear una plantilla vacía.
        </Text>

        <TextInput
          label="Lunes de la semana"
          type="date"
          value={weekDate}
          onChange={(e) => setWeekDate(e.target.value)}
          leftSection={<IconCalendar size={14} style={{ opacity: 0.7 }} />}
          radius="xl"
          size="sm"
          variant="filled"
        />

        <Divider my="xs" label="Elige el método de creación" labelPosition="center" />

        <Grid gutter="md" align="stretch">
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <Paper
              p="md"
              radius="md"
              bg="gray.0"
              withBorder
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--mantine-spacing-sm)',
              }}
            >
              <Stack gap={4} style={{ flexGrow: 1 }}>
                <ThemeIcon color="blue" variant="light" radius="md">
                  <IconUpload size={16} />
                </ThemeIcon>
                <Text fw={700} size="sm" mt="xs">
                  Subir con IA
                </Text>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                  Sube un PDF o imagen del menú semanal. La IA leerá e indexará los platos automáticamente.
                </Text>
              </Stack>
              <FileButton
                onChange={(file) => {
                  onClose();
                  handleUploadFile(file);
                }}
                accept="image/*,.pdf"
                disabled={uploading}
              >
                {(props) => (
                  <Button
                    {...props}
                    loading={uploading}
                    radius="xl"
                    size="xs"
                    color="blue"
                    fullWidth
                  >
                    Subir Archivo
                  </Button>
                )}
              </FileButton>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, xs: 6 }}>
            <Paper
              p="md"
              radius="md"
              bg="gray.0"
              withBorder
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--mantine-spacing-sm)',
              }}
            >
              <Stack gap={4} style={{ flexGrow: 1 }}>
                <ThemeIcon color="teal" variant="light" radius="md">
                  <IconEdit size={16} />
                </ThemeIcon>
                <Text fw={700} size="sm" mt="xs">
                  Crear Vacío
                </Text>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                  Inicializa una plantilla vacía y rellenala de manera manual día a día.
                </Text>
              </Stack>
              <Button
                onClick={() => {
                  onClose();
                  handleCreateEmptyMenu();
                }}
                loading={creatingEmpty}
                radius="xl"
                size="xs"
                color="teal"
                variant="light"
                fullWidth
              >
                Crear Manual
              </Button>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Modal>
  );
}
