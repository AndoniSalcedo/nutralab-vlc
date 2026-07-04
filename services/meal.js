function mapMealToClient(dbMeal) {
  if (!dbMeal) return null;
  return {
    id: dbMeal.id,
    jugadorId: dbMeal.jugador_id,
    takenAt: dbMeal.taken_at,
    dishName: dbMeal.dish_name,
    mealType: dbMeal.meal_type,
    ingredients: dbMeal.ingredients || [],
    calories: dbMeal.calories,
    notes: dbMeal.notes,
    hasPhoto: !!dbMeal.photo_size,
    photoMime: dbMeal.photo_mime,
    photoSize: dbMeal.photo_size,
    createdAt: dbMeal.created_at,
  };
}

export async function listPlayerMeals(jugadorId, { mealType, day } = {}) {
  const params = new URLSearchParams();
  params.append('jugador_id', jugadorId);
  if (mealType) params.append('mealType', mealType);
  if (day) params.append('day', day);

  const res = await fetch(`/api/comidas?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al listar comidas');
  
  const items = Array.isArray(data.meals) ? data.meals : [];

  const withUrls = items.map((m) => {
    const mapped = mapMealToClient(m);
    if (!mapped.hasPhoto) return mapped;
    return { ...mapped, photoUrl: `/api/comidas/photo?id=${m.id}` };
  });

  return withUrls;
}

export async function savePlayerMeal(jugadorId, payload) {
  let fd;
  if (payload instanceof FormData) {
    fd = payload;
  } else {
    fd = new FormData();
    if (payload.id) fd.append('id', payload.id);
    if (payload.takenAt) {
      const d = payload.takenAt instanceof Date ? payload.takenAt : new Date(payload.takenAt);
      if (!Number.isNaN(+d)) fd.append('takenAt', d.toISOString());
    }
    if (payload.dishName) fd.append('dishName', payload.dishName);
    if (payload.mealType) fd.append('mealType', payload.mealType);
    
    if (Array.isArray(payload.ingredients)) {
      fd.append('ingredients', JSON.stringify(payload.ingredients));
    } else if (typeof payload.ingredients === 'string') {
      const arr = payload.ingredients.split('\n').map(s => s.trim()).filter(Boolean);
      fd.append('ingredients', JSON.stringify(arr));
    }
    
    if (Number.isFinite(Number(payload.calories))) {
      fd.append('calories', String(payload.calories));
    }
    if (payload.notes) fd.append('notes', payload.notes);
    if (payload.photo) {
      fd.append('photo', payload.photo);
    }
  }

  if (!fd.has('jugador_id')) {
    fd.append('jugador_id', jugadorId);
  }

  const res = await fetch('/api/comidas', {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al guardar la comida');
  return mapMealToClient(data.meal);
}

export async function deletePlayerMeal(id) {
  const res = await fetch(`/api/comidas?id=${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar la comida');
  return data;
}
