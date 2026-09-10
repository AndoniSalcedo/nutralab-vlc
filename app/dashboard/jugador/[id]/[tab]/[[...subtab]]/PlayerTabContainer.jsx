'use client';

import { useRouter } from 'next/navigation';
import ResumenTab from '@/app/dashboard/jugador/[id]/_tabs/ResumenTab';
import MetricasTab from '@/app/dashboard/jugador/[id]/_tabs/MetricasTab';
import NutricionTab from '@/app/dashboard/jugador/[id]/_tabs/NutricionTab';

const DEFAULT_SUBTABS = {
  resumen: 'perfil',
  metricas: 'mediciones',
  nutricion: 'plan',
};

export default function PlayerTabContainer({
  tab = 'resumen',
  activeSubtab,
  jugador,
  ...rest
}) {
  const router = useRouter();
  const resolvedSubtab = activeSubtab || DEFAULT_SUBTABS[tab] || 'perfil';

  function handleSubtabChange(nextSubtab) {
    router.replace(`/dashboard/jugador/${jugador.id}/${tab}/${nextSubtab}`, { scroll: false });
  }

  if (tab === 'resumen') {
    return (
      <ResumenTab
        jugador={jugador}
        activeSubtab={resolvedSubtab}
        onSubtabChange={handleSubtabChange}
        {...rest}
      />
    );
  }

  if (tab === 'metricas') {
    return (
      <MetricasTab
        jugador={jugador}
        activeSubtab={resolvedSubtab}
        onSubtabChange={handleSubtabChange}
        pesajes={rest.pesajes}
        {...rest}
      />
    );
  }

  if (tab === 'nutricion') {
    return (
      <NutricionTab
        jugador={jugador}
        activeSubtab={resolvedSubtab}
        onSubtabChange={handleSubtabChange}
        {...rest}
      />
    );
  }

  return null;
}
