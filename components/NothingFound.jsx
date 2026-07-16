import { Box, Button, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';
import Link from 'next/link';

export default function NothingFound({
  title = 'Sin resultados',
  description,
  icon: Icon = IconInbox,
  actionLabel,
  onAction,
  actionHref,
  actionProps = {},
  secondaryLabel,
  onSecondary,
  secondaryHref,
  secondaryProps = {},
  compact = false,
  withPaper = false,
}) {
  const PIcon = Icon;
  const iconSize = compact ? 24 : 42;
  const themeIconSize = compact ? 40 : 70;
  const titleSize = compact ? 'sm' : 'md';

  const content = (
    <Stack align="center" gap={compact ? 4 : 'xs'}>
      <ThemeIcon
        size={themeIconSize}
        radius="xl"
        variant="light"
        color="gray"
        mb={compact ? 0 : 4}
        style={{ opacity: 0.6 }}
      >
        <PIcon size={iconSize} stroke={1.5} />
      </ThemeIcon>

      <Stack gap={0} align="center">
        <Text fw={700} size={titleSize} c="dark.3" ta="center">
          {title}
        </Text>
        {description && (
          <Text c="dimmed" size="xs" ta="center" lh={1.4} maw={compact ? 200 : 300}>
            {description}
          </Text>
        )}
      </Stack>

      {(actionLabel || secondaryLabel) && (
        <Group gap="xs" mt={compact ? 4 : 'sm'}>
          {secondaryHref ? (
            <Button component={Link} href={secondaryHref} variant="subtle" color="gray" size="xs" radius="xl" {...secondaryProps}>
              {secondaryLabel}
            </Button>
          ) : (
            secondaryLabel && (
              <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={onSecondary} {...secondaryProps}>
                {secondaryLabel}
              </Button>
            )
          )}
          {actionHref ? (
            <Button component={Link} href={actionHref} variant="light" color="dark" size="xs" radius="xl" {...actionProps}>
              {actionLabel}
            </Button>
          ) : (
            actionLabel && (
              <Button variant="light" color="dark" size="xs" radius="xl" onClick={onAction} {...actionProps}>
                {actionLabel}
              </Button>
            )
          )}
        </Group>
      )}
    </Stack>
  );

  if (withPaper) {
    return (
      <Paper
        radius="lg"
        shadow="sm"
        p={compact ? 'lg' : 40}
        bg="white"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: compact ? 150 : 250 }}
      >
        {content}
      </Paper>
    );
  }

  return (
    <Box py={compact ? 'lg' : 40} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {content}
    </Box>
  );
}
