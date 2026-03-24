import { FriendshipRow, FriendWithUser } from './repository';
import * as friendRepo from './repository';
import * as msgRepo from '../message/repository';
import { BadRequestError, NotFoundError, ConflictError } from '../../shared/errors';
import { emitToUser } from '../../socket';

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
  type: string = 'friend',
): Promise<FriendshipRow> {
  if (requesterId === addresseeId) {
    throw new BadRequestError('不能添加自己为好友');
  }

  // Check if already exists
  const existing = await friendRepo.findFriendship(requesterId, addresseeId);
  if (existing) {
    if (existing.status === 'accepted') {
      throw new ConflictError('你们已经是好友了');
    }
    if (existing.status === 'pending') {
      if (existing.requester_id === requesterId) {
        throw new ConflictError('你已经发送过好友请求了');
      } else {
        throw new ConflictError('对方已向你发送好友请求，请先处理');
      }
    }
    // Rejected - allow new request
  }

  const friendship = await friendRepo.createFriendRequest(requesterId, addresseeId, type);

  // Notify addressee
  emitToUser(addresseeId, 'friend:request', {
    friendship_id: friendship.id,
    from: requesterId,
    type: friendship.type,
  });

  return friendship;
}

export async function respondFriendRequest(
  userId: string,
  requesterId: string,
  accept: boolean,
): Promise<FriendshipRow> {
  const pending = await friendRepo.findPendingRequest(requesterId, userId);
  if (!pending) {
    throw new NotFoundError('好友请求不存在');
  }

  if (accept) {
    // Create private conversation first
    const conversation = await msgRepo.findPrivateConversation(userId, requesterId);
    let conversationId = conversation?.id;

    if (!conversationId) {
      const newConv = await msgRepo.createConversation('private');
      await msgRepo.addParticipant(newConv.id, userId);
      await msgRepo.addParticipant(newConv.id, requesterId);
      conversationId = newConv.id;
    }

    const friendship = await friendRepo.acceptFriendRequest(requesterId, userId, conversationId);
    if (!friendship) {
      throw new BadRequestError('接受好友请求失败');
    }

    // Notify requester
    emitToUser(requesterId, 'friend:accepted', {
      friendship_id: friendship.id,
      from: userId,
    });

    return friendship;
  } else {
    const friendship = await friendRepo.rejectFriendRequest(requesterId, userId);
    if (!friendship) {
      throw new BadRequestError('拒绝好友请求失败');
    }
    return friendship;
  }
}

export async function listFriends(
  userId: string,
  type?: string,
  status?: string,
): Promise<FriendWithUser[]> {
  return friendRepo.listFriends(userId, type, status);
}

export async function getPendingReceived(userId: string): Promise<FriendWithUser[]> {
  return friendRepo.getPendingReceived(userId);
}

export async function deleteFriend(userId: string, friendUserId: string): Promise<void> {
  const friendship = await friendRepo.findFriendship(userId, friendUserId);
  if (!friendship || friendship.status !== 'accepted') {
    throw new NotFoundError('好友关系不存在');
  }

  await friendRepo.deleteFriendship(userId, friendUserId);

  // Optionally notify the deleted friend
  emitToUser(friendUserId, 'friend:deleted', { from: userId });
}
