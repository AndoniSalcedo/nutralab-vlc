'use client';

import { Center, Text, rem } from '@mantine/core';

export function tabLabel(Icon, text, mobileText = text) {
  return (
    <Center style={{ gap: rem(6), minWidth: 0 }}>
      <Icon size={16} stroke={1.6} />
      <Text span size="sm" fw={600} lh={1} visibleFrom="sm">
        {text}
      </Text>
      <Text span size="xs" fw={700} lh={1} hiddenFrom="sm">
        {mobileText}
      </Text>
    </Center>
  );
}
