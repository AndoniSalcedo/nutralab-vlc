'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

// Trocea "1.552 ml", "10/10" o "35,5" en partes de texto y números (respetando , o . decimal)
function tokenize(text) {
  const parts = [];
  const re = /\d+(?:[.,]\d+)?/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    const raw = m[0];
    const sep = raw.includes(',') ? ',' : raw.includes('.') ? '.' : '';
    const decimals = sep ? raw.split(sep)[1].length : 0;
    parts.push({ number: Number(raw.replace(',', '.')), decimals, sep });
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

function render(parts, progress) {
  return parts
    .map((p) => {
      if (p.text !== undefined) return p.text;
      const v = (p.number * progress).toFixed(p.decimals);
      return p.sep === ',' ? v.replace('.', ',') : v;
    })
    .join('');
}

/**
 * Cifra que sube contando la primera vez que entra en pantalla (y cuando cambia).
 * Acepta números o textos con números ("3/3", "1552", "15 jul 2026" se deja tal cual si no es cifra pura).
 */
export default function AnimatedNumber({ value, duration = 0.9 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();
  const text = String(value ?? '');
  // Solo se anima si el texto es "numérico" (evita fechas tipo "15 jul 2026")
  const animatable = /^[^\d]*\d+(?:[.,]\d+)?(?:\s*[/·]\s*\d+(?:[.,]\d+)?)?[^\d]*$/.test(text) && !/[a-z]{3,}\s+\d/i.test(text);
  const [progress, setProgress] = useState(animatable && !reduce ? 0 : 1);
  const prevText = useRef(text);

  useEffect(() => {
    if (!animatable || reduce) {
      setProgress(1);
      return undefined;
    }
    if (!inView) return undefined;
    // Primera vez: de 0 al valor; después, pequeño rebote al cambiar
    const from = prevText.current === text ? 0 : 0.85;
    prevText.current = text;
    const controls = animate(from, 1, { duration: from ? 0.35 : duration, ease: [0.16, 1, 0.3, 1], onUpdate: setProgress });
    return () => controls.stop();
  }, [text, inView, animatable, reduce, duration]);

  return <span ref={ref}>{animatable ? render(tokenize(text), progress) : text}</span>;
}
