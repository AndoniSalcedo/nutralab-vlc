'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@mantine/core';

/**
 * Avatar de Mantine que vuelve a las iniciales si la imagen no carga.
 * Mantine ya lo hace con onError, pero si la imagen falla antes de hidratar
 * (SSR) el evento se pierde y queda el icono de imagen rota.
 */
export default function SafeAvatar({ src, imageProps, ...props }) {
  const imgRef = useRef(null);
  const [failed, setFailed] = useState(false);

  // Al cambiar de imagen se reintenta; si ya había fallado antes de hidratar, se detecta aquí
  useEffect(() => {
    const img = imgRef.current;
    setFailed(Boolean(img && img.complete && img.naturalWidth === 0));
  }, [src]);

  return (
    <Avatar
      {...props}
      src={failed ? undefined : src}
      imageProps={{
        ...imageProps,
        ref: imgRef,
        onError: (e) => {
          setFailed(true);
          imageProps?.onError?.(e);
        },
      }}
    />
  );
}
