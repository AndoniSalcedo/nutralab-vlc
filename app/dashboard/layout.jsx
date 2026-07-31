import DashboardShell from '@/components/DashboardShell';
import { getUser } from '@/lib/auth';
import { Box, Container } from '@mantine/core';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const user = await getUser();
  if (!user) redirect('/login');
  if (user.role === 'jugador') {
    return (
      <Box bg="white" mih="100vh" pt={ {sm: "md", base: 0}}>
        <Container size="xl" p={0}>
          {children}
        </Container>
      </Box>
    );
  }
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
