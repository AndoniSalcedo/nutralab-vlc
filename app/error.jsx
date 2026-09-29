'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import StatusScreen from '@/components/StatusScreen';

export default function Error({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      code="Ups"
      title="Algo ha salido mal"
      message="Hemos tenido un problema inesperado al cargar esta página. Puedes reintentar o volver al inicio."
      mascotState="embarrassed"
      speech="Vaya... esto no debería pasar 🥺"
      onRetry={() => retry()}
    />
  );
}
