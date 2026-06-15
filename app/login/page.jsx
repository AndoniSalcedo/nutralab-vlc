import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const user = await getUser();
  if (user) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
