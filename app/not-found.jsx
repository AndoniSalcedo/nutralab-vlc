import StatusScreen from '@/components/StatusScreen';

export const metadata = {
  title: 'Página no encontrada · Nutralab',
};

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="Esta página no existe"
      message="Puede que el enlace esté roto o que la página se haya movido. No pasa nada, te llevamos a un sitio conocido."
      speech="Mmm... por aquí no hay nada 🤔"
    />
  );
}
