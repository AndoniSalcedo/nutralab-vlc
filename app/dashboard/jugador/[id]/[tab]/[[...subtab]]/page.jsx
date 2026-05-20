import JugadorView from '../../JugadorView';

export const dynamic = 'force-dynamic';

export default function JugadorTabPage({ params }) {
  return (
    <JugadorView
      id={params.id}
      activeTab={params.tab}
      activeSubtab={params.subtab?.[0]}
    />
  );
}
