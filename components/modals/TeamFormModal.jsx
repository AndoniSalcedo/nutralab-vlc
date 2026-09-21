import React from 'react';
import { Group, Text } from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import TeamForm from '@/components/forms/TeamForm';
import ResponsiveModal from './ResponsiveModal';

export default function TeamFormModal({
  opened,
  onClose,
  modal,
  submitTeam,
  form,
  setForm,
  sourceTeamOptions,
  toggleCreateImport,
  isImportingPlayers,
  sourceTeam,
  selectedCount,
  selectedPlayerIds,
  onChangeSelectedPlayerIds,
  toggleCopyPlayer,
  saving,
  playerCountLabel,
  allPlayers,
}) {
  return (
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Icon3D name="soccer" size={26} />
          <Text fw={700}>
            {modal.type === 'copy'
              ? 'Copiar equipo a temporada'
              : modal.type === 'edit'
              ? 'Editar equipo'
              : 'Nuevo equipo'}
          </Text>
        </Group>
      }
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <TeamForm
        submitTeam={submitTeam}
        form={form}
        setForm={setForm}
        sourceTeamOptions={sourceTeamOptions}
        toggleCreateImport={toggleCreateImport}
        isImportingPlayers={isImportingPlayers}
        sourceTeam={sourceTeam}
        selectedCount={selectedCount}
        selectedPlayerIds={selectedPlayerIds}
        onChangeSelectedPlayerIds={onChangeSelectedPlayerIds}
        toggleCopyPlayer={toggleCopyPlayer}
        saving={saving}
        playerCountLabel={playerCountLabel}
        modalType={modal.type}
        allPlayers={allPlayers}
      />
    </ResponsiveModal>
  );
}
