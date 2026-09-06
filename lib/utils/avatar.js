export function initials(name = '') {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('');
}

const MAX_AVATAR_KB = 48;
const MAX_AVATAR_BYTES = MAX_AVATAR_KB * 1024;

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
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * Comprime una foto de perfil o logo de equipo a <= 48KB en formato WebP / JPEG
 * con resolución adaptada (máx 256x256) para evitar consumo excesivo en base de datos.
 */
export async function compressAvatar(file, {
  targetBytes = MAX_AVATAR_BYTES,
  initialQuality = 0.75,
  minQuality = 0.4,
  downscaleFactor = 0.8,
  maxIterations = 6,
  preferWebP = true,
  maxDim = 256,
} = {}) {
  if (!file || !(file instanceof File)) return file;

  const wantWebP = preferWebP && supportsWebP();
  const outType = wantWebP ? 'image/webp' : 'image/jpeg';
  const ext = wantWebP ? '.webp' : '.jpg';

  const img = await fileToImage(file);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Reducir siempre a maxDim (256x256 por defecto)
  if (width > maxDim || height > maxDim) {
    const ratio = width / height;
    if (width > height) {
      width = maxDim;
      height = Math.round(maxDim / ratio);
    } else {
      height = maxDim;
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
      q = Math.round((q - 0.1) * 10) / 10;
    }
    width = Math.max(64, Math.round(width * downscaleFactor));
    height = Math.max(64, Math.round(height * downscaleFactor));
    iter++;
  }

  URL.revokeObjectURL(img.src);
  const fallback = bestBlob || (await canvasToBlob(canvas, outType, minQuality));
  const name = file.name.replace(/\.\w+$/, '') + ext;
  return new File([fallback], name, { type: outType, lastModified: Date.now() });
}

/**
 * Convierte un campo de avatar (buffer, base64 o string) a un Data URL o Object URL
 */
export async function avatarFromRecord(avatar, avatarMime) {
  if (!avatar) return '';

  const ensureMime = (m) => (typeof m === 'string' && m.includes('/') ? m : 'image/png');
  const isDataURL = (s) => typeof s === 'string' && /^data:[^;]+;base64,/.test(s);
  const looksLikeBase64 = (s) =>
    typeof s === 'string' && /^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 50;

  if (typeof avatar === 'string') {
    if (isDataURL(avatar)) return avatar;
    if (avatar.startsWith('\\x')) {
      const hex = avatar.slice(2);
      const bytes = new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
      const blob = new Blob([bytes], { type: ensureMime(avatarMime) });
      return URL.createObjectURL(blob);
    }
    if (looksLikeBase64(avatar)) return `data:${ensureMime(avatarMime)};base64,${avatar}`;
    return avatar;
  }

  const toUint8 = (val) => {
    if (!val) return null;
    if (val.type === 'Buffer' && Array.isArray(val.data)) return new Uint8Array(val.data);
    if (val.data?.type === 'Buffer' && Array.isArray(val.data?.data)) return new Uint8Array(val.data.data);
    if (Array.isArray(val)) return new Uint8Array(val);
    if (val instanceof Uint8Array) return val;
    if (val instanceof ArrayBuffer) return new Uint8Array(val);

    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) return null;
      if (!keys.every((k) => /^\d+$/.test(k))) return null;
      let max = 0;
      for (let i = 0; i < keys.length; i++) {
        const k = parseInt(keys[i], 10);
        if (k > max) max = k;
      }
      const u8 = new Uint8Array(max + 1);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const v = val[k];
        const idx = parseInt(k, 10);
        u8[idx] = typeof v === 'number' && v >= 0 && v <= 255 ? v : 0;
      }
      return u8;
    }
    return null;
  };

  const u8 = toUint8(avatar);
  if (!u8) return '';

  const sniffMime = (bytes) => {
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    )
      return 'image/png';
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
      return 'image/jpeg';
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    )
      return 'image/webp';
    return null;
  };

  const mime = sniffMime(u8) || ensureMime(avatarMime);
  const blob = new Blob([u8], { type: mime });
  return URL.createObjectURL(blob);
}
