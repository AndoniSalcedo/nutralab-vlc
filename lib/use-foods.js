'use client';

import { useEffect, useState } from 'react';
import { getFoods } from '@/services/foods';

export function useFoods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getFoods()
      .then((items) => { if (active) setFoods(items); })
      .catch((error) => console.error('No se pudo cargar el catálogo de alimentos:', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { foods, loading };
}
