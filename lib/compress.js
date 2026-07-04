// --- CONSTANTES ---
const MAX_FOOD_KB = 1024; 
const MAX_FOOD_BYTES = MAX_FOOD_KB * 1024;
const MAX_DIMENSION_INITIAL = 1280; 

// --- HELPERS BASE ---

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), type, quality)
  );
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.decoding = 'async'; 
    img.src = URL.createObjectURL(file);
  });
}

function supportsWebP() {
  try {
    const c = document.createElement('canvas');
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch { return false; }
}

/**
 * Comprime una foto de comida.
 * - Objetivo: ~1MB
 * - Redimensiona primero si la imagen es gigante (>1280px).
 * - Baja calidad progresivamente.
 */
export async function compressFoodPhoto(file, {
  targetBytes = MAX_FOOD_BYTES,
  initialQuality = 0.9,
  minQuality = 0.6,
  downscaleFactor = 0.8,
  maxIterations = 6,
  preferWebP = true,
} = {}) {
  
  if (file.size <= targetBytes) return file;

  const wantWebP = preferWebP && supportsWebP();
  const outType = wantWebP ? 'image/webp' : 'image/jpeg';
  const ext = wantWebP ? '.webp' : '.jpg';

  const img = await fileToImage(file);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > MAX_DIMENSION_INITIAL || height > MAX_DIMENSION_INITIAL) {
    const ratio = width / height;
    if (width > height) {
      width = MAX_DIMENSION_INITIAL;
      height = Math.round(width / ratio);
    } else {
      height = MAX_DIMENSION_INITIAL;
      width = Math.round(height * ratio);
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  const attempt = async (w, h, quality) => {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return await canvasToBlob(canvas, outType, quality);
  };

  let bestBlob = null;
  let q = initialQuality;
  let iter = 0;

  while (iter < maxIterations) {
    q = initialQuality;
    
    while (q >= minQuality) {
      const blob = await attempt(width, height, q);
      
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;

      if (blob.size <= targetBytes) {
        URL.revokeObjectURL(img.src); 
        const name = file.name.replace(/\.\w+$/, '') + ext;
        return new File([blob], name, { type: outType, lastModified: Date.now() });
      }
      
      q = Math.round((q - 0.15) * 100) / 100;
    }

    width = Math.max(320, Math.round(width * downscaleFactor));
    height = Math.max(320, Math.round(height * downscaleFactor));
    iter++;
  }

  URL.revokeObjectURL(img.src);

  const fallback = bestBlob || (await canvasToBlob(canvas, outType, minQuality));
  const name = file.name.replace(/\.\w+$/, '') + ext;
  
  return new File([fallback], name, { type: outType, lastModified: Date.now() });
}
