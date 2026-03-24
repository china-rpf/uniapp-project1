import { MessageRow, ConversationRow } from './repository';
import * as msgRepo from './repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../shared/errors';
import { emitToClass } from '../../socket';
import * as classRepo from '../class/repository';

// Get or create class group conversation
export async function getOrCreateClassConversation(classId: string): Promise<ConversationRow> {
  let conversation = await msgRepo.findClassConversation(classId);

  if (!conversation) {
    conversation = await msgRepo.createConversation('group', classId);
  }

  return conversation;
}

// Get or create private conversation
export async function getOrCreatePrivateConversation(
  currentUserId: string,
  targetUserId: string,
): Promise<ConversationRow> {
  if (currentUserId === targetUserId) {
    throw new BadRequestError('不能和自己私聊');
  }

  let conversation = await msgRepo.findPrivateConversation(currentUserId, targetUserId);

  if (!conversation) {
    conversation = await msgRepo.createConversation('private');
    // Add both participants
    await msgRepo.addParticipant(conversation.id, currentUserId);
    await msgRepo.addParticipant(conversation.id, targetUserId);
  }

  return conversation;
}

// Add user to class conversation (when joining class)
export async function addUserToClassConversation(classId: string, userId: string): Promise<void> {
  const conversation = await getOrCreateClassConversation(classId);

  const isParticipant = await msgRepo.isParticipant(conversation.id, userId);
  if (!isParticipant) {
    await msgRepo.addParticipant(conversation.id, userId);
  }
}

// Send message
export async function sendMessage(
  userId: string,
  conversationId: string,
  type: string,
  content: string,
  replyToId?: string,
  metadata?: { filename?: string; size?: number } | null,
): Promise<MessageRow & { sender?: { nickname: string; avatar: string | null } }> {
  // Check if user is participant
  const isParticipant = await msgRepo.isParticipant(conversationId, userId);
  if (!isParticipant) {
    throw new ForbiddenError('你不是该会话的参与者');
  }

  const message = await msgRepo.createMessage(conversationId, userId, type, content, replyToId, metadata);

  // Get sender info for broadcast
  const senderInfo = await msgRepo.getSenderInfo(userId);

  return { ...message, sender: senderInfo };
}

// Get messages with pagination
export async function getMessages(
  userId: string,
  conversationId: string,
  cursor?: string,
  limit = 20,
): Promise<MessageRow[]> {
  // Check if user is participant
  const isParticipant = await msgRepo.isParticipant(conversationId, userId);
  if (!isParticipant) {
    throw new ForbiddenError('你不是该会话的参与者');
  }

  return msgRepo.getMessages(conversationId, cursor, limit);
}

// Recall message (within 2 minutes)
export async function recallMessage(userId: string, messageId: string): Promise<MessageRow> {
  const message = await msgRepo.recallMessage(messageId, userId);
  if (!message) {
    throw new BadRequestError('消息不存在或已超过撤回时限（2分钟）');
  }
  return message;
}

// Mark conversation as read
export async function markAsRead(userId: string, conversationId: string): Promise<void> {
  const isParticipant = await msgRepo.isParticipant(conversationId, userId);
  if (!isParticipant) {
    throw new ForbiddenError('你不是该会话的参与者');
  }
  await msgRepo.markAsRead(conversationId, userId);
}

// List user's conversations
export async function listConversations(userId: string) {
  // First, ensure user is in all their class conversations
  // This handles the case where users joined classes before the conversation system was set up
  const userClasses = await classRepo.listUserClasses(userId);

  for (const cls of userClasses) {
    await addUserToClassConversation(cls.id, userId);
  }

  return msgRepo.listUserConversations(userId);
}

// Get conversation detail
export async function getConversationDetail(userId: string, conversationId: string) {
  const isParticipant = await msgRepo.isParticipant(conversationId, userId);
  if (!isParticipant) {
    throw new ForbiddenError('你不是该会话的参与者');
  }

  const conversation = await msgRepo.findConversationById(conversationId);
  if (!conversation) {
    throw new NotFoundError('会话不存在');
  }

  return conversation;
}
