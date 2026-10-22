'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Paper, Stack } from '@mantine/core';
import { tabLabel } from '@/app/dashboard/jugador/[id]/_tabs/tab-label';
import { getSubtabControlData, resolveSubtab } from '@/app/dashboard/jugador/[id]/_tabs/subtab-config';
import headerClasses from '@/app/dashboard/jugador/[id]/_tabs/SubtabSectionHeader.module.css';
import PlayerSubtabControl from '@/app/dashboard/jugador/[id]/_tabs/PlayerSubtabControl';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

export default function PlayerSubtabLoading() {
  const params = useParams();
  const tab = params?.tab || 'resumen';
  const subtab = params?.subtab?.[0];

  const activeSubtab = resolveSubtab(tab, subtab);
  const controlData = getSubtabControlData(tab, tabLabel);
  const skeletonName = activeSubtab
    ? `player-dashboard-${tab}-${activeSubtab}`
    : `player-dashboard-${tab}`;

  // El selector de subpestañas se pinta de verdad; de los huesos capturados (que lo incluyen)
  // se descarta justo su altura, medida aquí, para que el resto encaje en cualquier ancho.
  const controlRef = useRef(null);
  const [controlHeight, setControlHeight] = useState(null);
  useLayoutEffect(() => {
    const el = controlRef.current;
    if (!el) return undefined;
    const update = () => setControlHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Stack gap={0}>
      <Paper ref={controlRef} p="xs" bg="white" className={headerClasses.subtabsHeader}>
        <PlayerSubtabControl value={activeSubtab} data={controlData} readOnly />
      </Paper>

      {controlHeight != null && (
        <BoneyardSkeleton name={skeletonName} loading={true} minY={controlHeight} />
      )}
    </Stack>
  );
}
