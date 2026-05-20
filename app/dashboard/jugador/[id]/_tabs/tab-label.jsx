'use client';

import { Center, Text, rem } from '@mantine/core';

export function tabLabel(Icon, text) {
  return (
    <Center style={{ gap: rem(8) }}>
      <Icon size={16} stroke={1.6} />
      <Text span size="sm" fw={600} lh={1}>{text}</Text>
    </Center>
  );
}
