import DashboardShell from '@/components/DashboardShell';

export default function BoneyardLayout({ children }) {
  const mockUser = {
    id: 'boneyard-mock-user',
    email: 'boneyard@nutralab.com',
    role: 'tecnico',
    name: 'Boneyard Crawler',
  };

  return <DashboardShell user={mockUser}>{children}</DashboardShell>;
}
