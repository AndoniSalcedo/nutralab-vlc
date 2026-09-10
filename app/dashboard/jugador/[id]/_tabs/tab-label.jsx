'use client';

import { Center, Text, rem } from '@mantine/core';

export function tabLabel(Icon, text, mobileText = text, id = null) {
  return (
    <Center id={id || undefined} style={{ gap: rem(8), minWidth: 0, width: '100%' }}>
      <Icon size={16} stroke={1.6} />
      <Text span size="sm" fw={600} lh={1} visibleFrom="sm">
        {text}
      </Text>
      <Text span size="sm" fw={600} lh={1} hiddenFrom="sm">
        {mobileText}
      </Text>
    </Center>
  );
}
