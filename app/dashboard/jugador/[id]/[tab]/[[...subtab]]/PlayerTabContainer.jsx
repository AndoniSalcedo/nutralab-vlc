'use client';

import { useRouter } from 'next/navigation';
import ResumenTab from '@/app/dashboard/jugador/[id]/_tabs/ResumenTab';
import MetricasTab from '@/app/dashboard/jugador/[id]/_tabs/MetricasTab';
import NutricionTab from '@/app/dashboard/jugador/[id]/_tabs/NutricionTab';

export default function PlayerTabContainer({
  tab,
  activeSubtab,
  jugador,
  ...rest
}) {
  const router = useRouter();

  function handleSubtabChange(nextSubtab) {
    router.replace(`/dashboard/jugador/${jugador.id}/${tab}/${nextSubtab}`, { scroll: false });
  }

  if (tab === 'resumen') {
    return (
      <ResumenTab
        jugador={jugador}
        activeSubtab={activeSubtab}
        onSubtabChange={handleSubtabChange}
        {...rest}
      />
    );
  }

  if (tab === 'metricas') {
    return (
      <MetricasTab
        jugador={jugador}
        activeSubtab={activeSubtab}
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
        activeSubtab={activeSubtab}
        onSubtabChange={handleSubtabChange}
        {...rest}
      />
    );
  }

  return null;
}
