/**
 * Validación de ficheros subidos. El `File.type` lo controla el cliente, así que
 * se comprueban los "magic bytes" y se deriva el MIME real del contenido.
 */
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 7 * 1024 * 1024;

function startsWith(buf, bytes, offset = 0) {
  return bytes.every((b, i) => buf[offset + i] === b);
}

function sniffImageMime(buf) {
  if (!buf || buf.length < 12) return null;
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = buf.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }
  return null;
}

function isPdf(buf) {
  return Boolean(buf) && buf.length > 5 && startsWith(buf, [0x25, 0x50, 0x44, 0x46, 0x2d]);
}

/** Valida una imagen subida y devuelve { buffer, mime, size }. Lanza si no es válida. */
export async function readImageUpload(file, { maxBytes = MAX_IMAGE_BYTES } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Archivo no válido');
  if (file.size > maxBytes) {
    throw new Error(`La imagen supera el tamaño máximo de ${Math.round(maxBytes / 1024 / 1024)} MB`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = sniffImageMime(buffer);
  if (!mime) throw new Error('Formato de imagen no permitido (usa JPG, PNG o WebP)');
  return { buffer, mime, size: buffer.length };
}

/** Valida un PDF o una imagen (menús). Devuelve { buffer, mime }. */
export async function readDocumentUpload(file, { allowImages = false, maxBytes = MAX_DOCUMENT_BYTES } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Archivo no válido');
  if (file.size > maxBytes) {
    throw new Error(`El archivo supera el tamaño máximo de ${Math.round(maxBytes / 1024 / 1024)} MB`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isPdf(buffer)) return { buffer, mime: 'application/pdf' };
  if (allowImages) {
    const mime = sniffImageMime(buffer);
    if (mime) return { buffer, mime };
  }
  throw new Error(allowImages ? 'Formato no permitido (PDF, JPG, PNG o WebP)' : 'Solo se admiten archivos PDF');
}

/** Formato hexadecimal que espera PostgREST para columnas bytea. */
export function toByteaHex(buffer) {
  return `\\x${buffer.toString('hex')}`;
}
