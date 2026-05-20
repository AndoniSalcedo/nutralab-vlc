import DashboardShell from '@/components/DashboardShell';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const user = await getUser();
  if (!user) redirect('/login');
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
