import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import DiarioComidasSubtab from '@/app/dashboard/jugador/[id]/_tabs/resumen/DiarioComidasSubtab';
import { mockPlayers, mockMeals } from '@/lib/boneyardMockData';

export const dynamic = 'force-dynamic';

export default function BoneyardDiarioComidas() {
  const jugador = mockPlayers.find((p) => p.id === 220);
  return (
    <BoneyardSkeleton name="diario-comidas" loading={false}>
      <div style={{ padding: '20px' }}>
        <DiarioComidasSubtab jugador={jugador} initialMeals={mockMeals} readOnly={false} />
      </div>
    </BoneyardSkeleton>
  );
}
