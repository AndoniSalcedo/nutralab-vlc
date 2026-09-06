/**
 * Utility functions to handle canvas-based image cropping and rotation
 * for avatar, player, team and staff photo uploads.
 */

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Calculates bounding box of a rotated rectangle
 */
function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Crops an image given its source URL / ObjectURL, pixel crop coordinates and optional rotation.
 * Returns a File ready for downstream compression and uploading.
 */
export async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  fileName = 'cropped-image.jpg',
  outputType = 'image/jpeg',
  quality = 0.92
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context available');
  }

  const rotRad = getRadianAngle(rotation);
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    originalWidth,
    originalHeight,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas center to draw the image rotated
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-originalWidth / 2, -originalHeight / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped region onto a new canvas
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('No 2d context for cropped canvas');
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const safeName = fileName.replace(/\.[^/.]+$/, '') + '.jpg';
      const file = new File([blob], safeName, { type: outputType, lastModified: Date.now() });
      resolve(file);
    }, outputType, quality);
  });
}
