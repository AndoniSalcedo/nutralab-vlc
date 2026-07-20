import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function JugadorPage({ params }) {
  redirect(`/dashboard/jugador/${params.id}/resumen/perfil`);
}
