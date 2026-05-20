'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Dropzone } from '@mantine/dropzone';
import { IconCloudUpload, IconDownload, IconX, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { 
  Group, 
  Text, 
  Button, 
  useMantineTheme, 
  Box, 
  Paper, 
  Stack, 
  Title, 
  Table, 
  ScrollArea, 
  Alert 
} from '@mantine/core';

export default function ExcelImporter() {
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const theme = useMantineTheme();
  const openRef = useRef(null);

  const EXCEL_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  function handleDrop(files) {
    const file = files[0];
    if (!file) return;
    setSuccess(false);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;
      const wb = XLSX.read(data, { type: 'array' });
      const first = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(first, { defval: '' });
      setAllRows(json);
      setRows(json.slice(0, 5));
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch('/api/import-mediciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: allRows }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al importar');
      setSuccess(true);
      setRows([]);
      setAllRows([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Paper radius="md" p="md" withBorder shadow="sm" bg="white">
      <Stack gap="md">
        <div>
          <Title order={4} c="dark.8">Importar mediciones de plantilla</Title>
          <Text size="xs" c="dimmed">
            El archivo Excel debe contener columnas como "Nombre", "Apellidos", "Fecha", "Peso", "% Grasa", "Masa Magra", "Pliegues".
          </Text>
        </div>

        <Box pos="relative">
          <Dropzone
            openRef={openRef}
            onDrop={handleDrop}
            accept={EXCEL_TYPES}
            maxSize={30 * 1024 ** 2}
            radius="md"
            activateOnClick={false}
            style={{
              border: '2px dashed var(--mantine-color-gray-4)',
              backgroundColor: 'var(--mantine-color-gray-0)',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 150ms ease, background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--mantine-color-blue-4)';
              e.currentTarget.style.backgroundColor = 'var(--mantine-color-blue-0)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
              e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
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
                <Dropzone.Reject>Solo Excel</Dropzone.Reject>
                <Dropzone.Idle>Subir Excel (.xls / .xlsx)</Dropzone.Idle>
              </Text>

              <Text ta="center" size="sm" c="dimmed" mt={7}>
                Arrastra y suelta el archivo o haz clic para seleccionarlo. <br/>
                Se aceptan únicamente archivos <i>.xls</i> y <i>.xlsx</i>.
              </Text>
            </div>

            <Button
              size="xs"
              radius="xl"
              style={{ pointerEvents: 'all', marginTop: '20px' }}
              onClick={() => openRef.current?.()}
              variant="light"
            >
              Seleccionar archivo
            </Button>
          </Dropzone>
        </Box>

        {error && (
          <Alert color="red" icon={<IconAlertTriangle size={16} />} radius="md">
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="green" icon={<IconCheck size={16} />} radius="md" title="Éxito">
            ¡Mediciones de plantilla importadas correctamente!
          </Alert>
        )}

        {rows.length > 0 && (
          <Stack gap="sm">
            <Text size="xs" fw={700} c="dimmed">
              Vista previa (primeros {rows.length} registros de {allRows.length}):
            </Text>
            
            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    {Object.keys(rows[0]).map((k) => (
                      <Table.Th key={k}>{k}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((r, i) => (
                    <Table.Tr key={i}>
                      {Object.keys(rows[0]).map((k) => (
                        <Table.Td key={k}>{String(r[k])}</Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            
            <Button 
              onClick={handleImport} 
              loading={importing} 
              size="xs" 
              color="blue" 
              radius="xl"
              fullWidth
            >
              Confirmar e Importar {allRows.length} Mediciones
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
