import JugadorView from './JugadorView';

export const dynamic = 'force-dynamic';

export default function JugadorPage({ params }) {
  return <JugadorView id={params.id} />;
}
