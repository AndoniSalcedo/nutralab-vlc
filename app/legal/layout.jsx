import { getUser } from '@/lib/auth/session';
import DashboardShell from '@/components/DashboardShell';
import LegalLayoutClient from './LegalLayoutClient';

export default async function LegalLayout({ children }) {
  const user = await getUser();

  return (
    <DashboardShell user={user}>
      <LegalLayoutClient>{children}</LegalLayoutClient>
    </DashboardShell>
  );
}
