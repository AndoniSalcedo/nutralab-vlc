import Link from 'next/link';
import { Image } from '@mantine/core';

export default function Logo() {
  return (
    <Link href="/dashboard">
      <Image src="/logo.png" alt="Nutralab" style={{ width: 200, height: 'auto', cursor: 'pointer' }} />
    </Link>
  );
}
