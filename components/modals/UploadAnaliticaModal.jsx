import React from 'react';
import { useMantineTheme, Modal, Stack, Group, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconDownload, IconX, IconCloudUpload } from '@tabler/icons-react';

export default function UploadAnaliticaModal({
  opened,
  onClose,
  fecha,
  setFecha,
  handleUpload,
  uploading
}) {
  const theme = useMantineTheme();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconUpload size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={700}>Subir analítica</Text>
        </Group>
      }
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <DatePickerInput
          label="Fecha extracción"
          placeholder="Selecciona la fecha del análisis"
          value={fecha}
          onChange={setFecha}
          valueFormat="DD/MM/YYYY"
          clearable
          maxDate={new Date()}
        />
        <Dropzone
          onDrop={handleUpload}
          accept={['application/pdf']}
          maxSize={10 * 1024 ** 2}
          loading={uploading}
          radius="md"
          activateOnClick={true}
          style={{
            border: '2px dashed var(--mantine-color-gray-4)',
            backgroundColor: 'var(--mantine-color-gray-0)',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, background-color 150ms ease',
          }}
        >
          <div style={{ pointerEvents: 'none' }}>
            <Group justify="center">
              <Dropzone.Accept>
                <IconDownload size={50} color={theme.colors.blue[6]} stroke={1.5} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconCloudUpload size={50} stroke={1.5} color="var(--mantine-color-dimmed)" />
              </Dropzone.Idle>
            </Group>

            <Text ta="center" fw={700} fz="lg" mt="xl">
              <Dropzone.Accept>¡Suelta el archivo aquí!</Dropzone.Accept>
              <Dropzone.Reject>Solo PDF</Dropzone.Reject>
              <Dropzone.Idle>Subir PDF de Analítica</Dropzone.Idle>
            </Text>

            <Text ta="center" size="sm" c="dimmed" mt={7}>
              Arrastra y suelta el archivo o haz clic para seleccionarlo.
            </Text>
          </div>
        </Dropzone>
      </Stack>
    </Modal>
  );
}
