'use client';

import { Box, Paper, Stack } from '@mantine/core';
import { tabLabel } from './tab-label';
import { getSubtabControlData } from './subtab-config';
import PlayerSubtabControl from './PlayerSubtabControl';
import MensajesSubtab from './resumen/MensajesSubtab';
import PerfilSubtab from './resumen/PerfilSubtab';
import DiarioComidasSubtab from './resumen/DiarioComidasSubtab';

export default function ResumenTab({
  jugador,
  evoluciones = [],
  messages = [],
  pesajes = [],
  registrosHidratacion = [],
  menus = [],
  activeSubtab,
  onSubtabChange,
  readOnly = false,
  isPlayer = false,
}) {
  return (
    <Stack gap={0}>
      <Paper
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
        <PlayerSubtabControl
          value={activeSubtab}
          onChange={onSubtabChange}
          data={getSubtabControlData('resumen', tabLabel)}
        />
      </Paper>

      <Box mt={0}>
        {activeSubtab === 'perfil' && (
          <PerfilSubtab
            jugador={jugador}
            evoluciones={evoluciones}
            pesajes={pesajes}
            messages={messages}
            registrosHidratacion={registrosHidratacion}
            menus={menus}
            readOnly={readOnly}
            isPlayer={isPlayer}
          />
        )}
        {activeSubtab === 'diario' && <DiarioComidasSubtab jugador={jugador} readOnly={!isPlayer} />}
        {activeSubtab === 'mensajes' && <MensajesSubtab jugador={jugador} messages={messages} readOnly={readOnly} />}
      </Box>
    </Stack>
  );
}
