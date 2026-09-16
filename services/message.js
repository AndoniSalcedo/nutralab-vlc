import {
  sendMessageAction
} from '@/actions/messageActions';

export async function sendMessage(payload) {
  return await sendMessageAction(payload);
}
