import Link from 'next/link';
import { Image } from '@mantine/core';

export default function Logo({ href = '/dashboard', width = 180 }) {
  return (
    <Link href={href}>
      <Image src="/logo.png" alt="Nutralab" style={{ width, height: 'auto', cursor: 'pointer' }} />
    </Link>
  );
}
