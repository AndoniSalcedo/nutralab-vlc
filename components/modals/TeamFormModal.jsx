import React from 'react';
import { Modal, Group, Text } from '@mantine/core';
import { IconUsersGroup } from '@tabler/icons-react';
import TeamForm from '@/components/forms/TeamForm';

export default function TeamFormModal({
  opened,
  onClose,
  modal,
  submitTeam,
  form,
  setForm,
  sourceTeamOptions,
  createSourceTeamId,
  toggleCreateImport,
  selectCreateSourceTeam,
  isImportingPlayers,
  sourceTeam,
  selectedCount,
  copyPlayers,
  allCopyPlayersSelected,
  someCopyPlayersSelected,
  toggleAllCopyPlayers,
  selectedPlayerIds,
  toggleCopyPlayer,
  saving,
  playerCountLabel
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconUsersGroup size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={700}>
            {modal.type === 'copy' ? 'Copiar equipo a temporada' : 'Nuevo equipo'}
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
        createSourceTeamId={createSourceTeamId}
        toggleCreateImport={toggleCreateImport}
        selectCreateSourceTeam={selectCreateSourceTeam}
        isImportingPlayers={isImportingPlayers}
        sourceTeam={sourceTeam}
        selectedCount={selectedCount}
        copyPlayers={copyPlayers}
        allCopyPlayersSelected={allCopyPlayersSelected}
        someCopyPlayersSelected={someCopyPlayersSelected}
        toggleAllCopyPlayers={toggleAllCopyPlayers}
        selectedPlayerIds={selectedPlayerIds}
        toggleCopyPlayer={toggleCopyPlayer}
        saving={saving}
        playerCountLabel={playerCountLabel}
        modalType={modal.type}
      />
    </Modal>
  );
}
