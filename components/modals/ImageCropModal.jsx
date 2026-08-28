'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import {
  Modal,
  Button,
  Group,
  Stack,
  Slider,
  Text,
  ActionIcon,
  Tooltip,
  Box,
} from '@mantine/core';
import {
  IconZoomIn,
  IconZoomOut,
  IconRotateClockwise,
  IconCheck,
  IconX,
  IconRefresh,
} from '@tabler/icons-react';
import { getCroppedImg } from '@/lib/cropImage';

export default function ImageCropModal({
  opened,
  onClose,
  imageSrc,
  fileName = 'avatar.jpg',
  cropShape = 'round',
  aspect = 1,
  title = 'Ajustar y encuadrar imagen',
  onCropConfirmed,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((newCrop) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom) => {
    setZoom(newZoom);
  }, []);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  }, []);

  const handleClose = useCallback(() => {
    if (processing) return;
    handleReset();
    onClose?.();
  }, [processing, handleReset, onClose]);

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        fileName
      );
      handleReset();
      onCropConfirmed?.(croppedFile);
      onClose?.();
    } catch (err) {
      console.error('Error cropping image:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="sm" c="dark.8">
          {title}
        </Text>
      }
      size="md"
      centered
      radius="md"
      closeOnClickOutside={!processing}
      closeOnEscape={!processing}
      withCloseButton={!processing}
      styles={{
        header: {
          paddingBottom: 10,
          borderBottom: '1px solid var(--mantine-color-gray-2)',
        },
        body: {
          paddingTop: 16,
        },
      }}
    >
      <Stack gap="md">
        {/* Contenedor del Cropper */}
        <Box
          style={{
            position: 'relative',
            width: '100%',
            height: 320,
            background: '#141517',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={cropShape}
              showGrid
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropComplete}
            />
          )}
        </Box>

        <Text size="xs" c="dimmed" ta="center">
          Arrastra para centrar el encuadre y ajusta el zoom o la rotación según prefieras.
        </Text>

        {/* Controles de Zoom y Rotación */}
        <Group justify="space-between" align="center" gap="sm">
          <Group gap="xs" style={{ flex: 1 }}>
            <IconZoomOut size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
            <Slider
              value={zoom}
              onChange={setZoom}
              min={1}
              max={3}
              step={0.05}
              size="sm"
              color="blue"
              style={{ flex: 1 }}
              disabled={processing}
            />
            <IconZoomIn size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
          </Group>

          <Group gap="xs">
            <Tooltip label="Girar 90°" withArrow position="top">
              <ActionIcon
                variant="light"
                color="gray"
                size="md"
                radius="md"
                onClick={handleRotate}
                disabled={processing}
              >
                <IconRotateClockwise size={16} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Restablecer posición" withArrow position="top">
              <ActionIcon
                variant="light"
                color="gray"
                size="md"
                radius="md"
                onClick={handleReset}
                disabled={processing}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Botones de acción */}
        <Group justify="flex-end" gap="xs" mt="sm">
          <Button
            variant="default"
            size="xs"
            radius="md"
            onClick={handleClose}
            disabled={processing}
            leftSection={<IconX size={14} />}
          >
            Cancelar
          </Button>
          <Button
            color="blue"
            size="xs"
            radius="md"
            onClick={handleApplyCrop}
            loading={processing}
            leftSection={<IconCheck size={14} />}
          >
            Aplicar recorte
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
