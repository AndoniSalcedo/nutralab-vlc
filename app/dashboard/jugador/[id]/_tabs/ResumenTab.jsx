'use client';

import { motion } from 'motion/react';
import { Paper, Stack } from '@mantine/core';
import { tabLabel } from './tab-label';
import { getSubtabControlData } from './subtab-config';
import PlayerSubtabControl from './PlayerSubtabControl';
import headerClasses from './SubtabSectionHeader.module.css';
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
  latestPlan = null,
  activeSubtab = 'perfil',
  onSubtabChange,
  readOnly = false,
  isPlayer = false,
}) {
  return (
    <Stack gap={0}>
      <Paper
        p="xs"
        bg="white"
        className={headerClasses.subtabsHeader}
      >
        <PlayerSubtabControl
          value={activeSubtab}
          onChange={onSubtabChange}
          data={getSubtabControlData('resumen', tabLabel)}
        />
      </Paper>

      {/* Cambio de subpestaña con un fundido corto (antes cambiaba de golpe) */}
      <motion.div
        key={activeSubtab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {activeSubtab === 'perfil' && (
          <PerfilSubtab
            jugador={jugador}
            evoluciones={evoluciones}
            pesajes={pesajes}
            messages={messages}
            registrosHidratacion={registrosHidratacion}
            menus={menus}
            latestPlan={latestPlan}
            readOnly={readOnly}
            isPlayer={isPlayer}
          />
        )}
        {activeSubtab === 'diario' && <DiarioComidasSubtab jugador={jugador} readOnly={!isPlayer} />}
        {activeSubtab === 'mensajes' && <MensajesSubtab jugador={jugador} messages={messages} readOnly={readOnly} />}
      </motion.div>
    </Stack>
  );
}
