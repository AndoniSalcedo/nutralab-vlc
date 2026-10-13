'use client';

import { SegmentedControl } from '@mantine/core';
import classes from './SubtabControl.module.css';

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
      bg="rgba(108, 112, 90, 0.08)"
      data={data}
      styles={styles}
      classNames={{ root: classes.root, control: classes.control, label: classes.label }}
      readOnly={readOnly}
    />
  );
}
