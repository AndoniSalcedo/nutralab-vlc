'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Dropzone } from '@mantine/dropzone';
import { IconCloudUpload, IconDownload, IconX } from '@tabler/icons-react';
import { Group, Text, Button, useMantineTheme, Box } from '@mantine/core';

export default function ExcelImporter() {
  const [rows, setRows] = useState([]);
  const theme = useMantineTheme();
  const openRef = useRef(null);

  const EXCEL_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  function handleDrop(files) {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;
      const wb = XLSX.read(data, { type: 'array' });
      const first = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(first, { defval: '' });
      setRows(json.slice(0, 8));
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="card stack">
      <div>
        <h3 style={{ margin: 0 }}>Vista previa de importación Excel</h3>
        <p className="muted small">Aquí validas columnas antes de mapearlas a Supabase. He dejado la base lista para convertirlo en importador definitivo.</p>
      </div>

      <Box pos="relative" mb="md">
        <Dropzone
          openRef={openRef}
          onDrop={handleDrop}
          accept={EXCEL_TYPES}
          maxSize={30 * 1024 ** 2}
          radius="md"
          activateOnClick={false}
          style={{
            border: '2px dashed var(--mantine-color-gray-4)',
            backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--mantine-color-blue-4)';
            e.currentTarget.style.backgroundColor = 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-5))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
            e.currentTarget.style.backgroundColor = 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))';
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
              Se acepta únicamente archivos <i>.xls</i> y <i>.xlsx</i>.
            </Text>
          </div>

          <Button
            size="md"
            radius="xl"
            style={{ pointerEvents: 'all', marginTop: '20px' }}
            onClick={() => openRef.current?.()}
            variant="light"
          >
            Seleccionar archivo
          </Button>
        </Dropzone>
      </Box>

      {rows.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>{Object.keys(rows[0]).map((k) => <th key={k}>{k}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>{Object.keys(rows[0]).map((k) => <td key={k}>{String(r[k])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
