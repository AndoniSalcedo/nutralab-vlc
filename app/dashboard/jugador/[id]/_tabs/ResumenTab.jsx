'use client';

import { Box, Paper, SegmentedControl, Stack } from '@mantine/core';
import { tabLabel } from './tab-label';
import { getSubtabControlData } from './subtab-config';
import MensajesSubtab from './resumen/MensajesSubtab';
import PerfilSubtab from './resumen/PerfilSubtab';
import DiarioComidasSubtab from './resumen/DiarioComidasSubtab';

export default function ResumenTab({ jugador, evoluciones = [], messages = [], activeSubtab, onSubtabChange, readOnly = false, isPlayer = false }) {
  return (
    <Stack gap={0}>
      <Paper
        data-boneyard-ignore="true"
        p="xs"
        bg="white"
        radius={0}
        style={{
          zIndex: 99,
          position: 'sticky',
          top: 0,
          clipPath: 'inset(0 -100% 0 -100%)',
          width: '100%',
          borderBottom: 0,
          borderLeft: '1px solid var(--mantine-color-gray-3)',
          borderRight: '1px solid var(--mantine-color-gray-3)',
          boxShadow: 'none',
        }}
      >
        <SegmentedControl
          value={activeSubtab}
          onChange={onSubtabChange}
          fullWidth
          radius="xl"
          size="sm"
          bg="gray.1"
          data={getSubtabControlData('resumen', tabLabel)}
          styles={{
            root: { border: 'none', width: '100%' },
            indicator: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
          }}
        />
      </Paper>

      <Box mt={0}>
        {activeSubtab === 'perfil' && <PerfilSubtab jugador={jugador} evoluciones={evoluciones} readOnly={readOnly} />}
        {activeSubtab === 'diario' && <DiarioComidasSubtab jugador={jugador} readOnly={!isPlayer} />}
        {activeSubtab === 'mensajes' && <MensajesSubtab jugador={jugador} messages={messages} readOnly={readOnly} />}
      </Box>
    </Stack>
  );
}
