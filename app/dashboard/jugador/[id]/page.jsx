import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function JugadorPage({ params }) {
  const { id } = await params;
  redirect(`/dashboard/jugador/${id}/resumen/perfil`);
}
