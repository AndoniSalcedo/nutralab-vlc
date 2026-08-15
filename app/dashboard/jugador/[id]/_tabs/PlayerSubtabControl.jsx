'use client';

import { SegmentedControl } from '@mantine/core';

const styles = () => ({
  root: {
    width: '100%',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
  },
  indicator: {
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  },
  label: {
    padding: '8px 4px',
    color: 'var(--mantine-color-dimmed)',
  },
});

/** Shared subtab selector design for both mobile and desktop. */
export default function PlayerSubtabControl({ value, onChange, data, readOnly = false }) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      fullWidth
      radius="xl"
      size="md"
      transitionDuration={200}
      color="white"
      bg="gray.1"
      data={data}
      styles={styles}
      readOnly={readOnly}
    />
  );
}
