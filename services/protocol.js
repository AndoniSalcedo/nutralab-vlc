import {
  transferProtocolAction,
  batchImportProtocolsAction
} from '@/actions/protocolActions';

export async function transferProtocol(payload) {
  return await transferProtocolAction(payload);
}

export async function batchImportProtocols({ sourceTeamId, targetTeamId, protocols }) {
  return await batchImportProtocolsAction({ sourceTeamId, targetTeamId, protocols });
}
