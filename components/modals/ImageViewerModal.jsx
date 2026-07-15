import React from 'react';
import { Modal, Stack, Box, Image, ActionIcon, Paper, Text } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

export default function ImageViewerModal({ opened, onClose, viewer }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      withCloseButton={false}
      padding={0}
      radius="lg"
      styles={{ body: { padding: 0, backgroundColor: 'black' } }}
    >
      <Stack gap={0} bg="black" style={{ position: 'relative' }}>
        <Box style={{ position: 'relative' }}>
          {viewer.src ? (
            <Image src={viewer.src} alt="" fit="contain" h="auto" w="100%" style={{ maxHeight: '80vh' }} />
          ) : (
            <Box h={300} c="dimmed" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}>Sin imagen</Box>
          )}

          <ActionIcon
            variant="filled"
            color="dark"
            radius="xl"
            size="lg"
            onClick={onClose}
            style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
          >
            <IconX size={20} />
          </ActionIcon>
        </Box>

        {viewer.caption && (
          <Paper p="md" bg="dark.7" radius={0}>
            <Text c="white" size="sm" ta="center">{viewer.caption}</Text>
          </Paper>
        )}
      </Stack>
    </Modal>
  );
}
