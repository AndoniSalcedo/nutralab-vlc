import DashboardShell from '@/components/DashboardShell';
import { TeamHeaderSlotProvider } from '@/components/TeamHeaderContext';

export default function BoneyardLayout({ children }) {
  const mockUser = {
    id: 'boneyard-mock-user',
    email: 'boneyard@nutralab.com',
    role: 'tecnico',
    name: 'Boneyard Crawler',
  };

  return (
    <DashboardShell user={mockUser}>
      <TeamHeaderSlotProvider>{children}</TeamHeaderSlotProvider>
    </DashboardShell>
  );
}
