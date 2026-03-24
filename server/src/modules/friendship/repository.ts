import { query, queryOne } from '../../db/postgres';
import { pool } from '../../db/postgres';

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  type: string;
  status: string;
  conversation_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface FriendWithUser extends FriendshipRow {
  user_id: string;
  nickname: string | null;
  avatar: string | null;
}

export async function findFriendship(userId1: string, userId2: string): Promise<FriendshipRow | null> {
  return queryOne<FriendshipRow>(
    `SELECT * FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [userId1, userId2],
  );
}

export async function findPendingRequest(requesterId: string, addresseeId: string): Promise<FriendshipRow | null> {
  return queryOne<FriendshipRow>(
    `SELECT * FROM friendships WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending'`,
    [requesterId, addresseeId],
  );
}

export async function createFriendRequest(
  requesterId: string,
  addresseeId: string,
  type: string,
): Promise<FriendshipRow> {
  const rows = await query<FriendshipRow>(
    `INSERT INTO friendships (requester_id, addressee_id, type) VALUES ($1, $2, $3) RETURNING *`,
    [requesterId, addresseeId, type],
  );
  return rows[0];
}

export async function acceptFriendRequest(
  requesterId: string,
  addresseeId: string,
  conversationId: string,
): Promise<FriendshipRow | null> {
  return queryOne<FriendshipRow>(
    `UPDATE friendships SET status = 'accepted', conversation_id = $3, updated_at = NOW()
     WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending'
     RETURNING *`,
    [requesterId, addresseeId, conversationId],
  );
}

export async function rejectFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<FriendshipRow | null> {
  return queryOne<FriendshipRow>(
    `UPDATE friendships SET status = 'rejected', updated_at = NOW()
     WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending'
     RETURNING *`,
    [requesterId, addresseeId],
  );
}

export async function listFriends(
  userId: string,
  type?: string,
  status?: string,
): Promise<FriendWithUser[]> {
  const conditions: string[] = [
    '(f.requester_id = $1 OR f.addressee_id = $1)',
  ];
  const params: any[] = [userId];
  let paramIdx = 2;

  if (type) {
    conditions.push(`f.type = $${paramIdx++}`);
    params.push(type);
  }
  if (status) {
    conditions.push(`f.status = $${paramIdx++}`);
    params.push(status);
  }

  const where = conditions.join(' AND ');

  return query<FriendWithUser>(
    `SELECT f.*,
       CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END as user_id,
       u.nickname, u.avatar, u.gender
     FROM friendships f
     INNER JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
     WHERE ${where}
     ORDER BY f.updated_at DESC`,
    params,
  );
}

export async function getPendingReceived(userId: string): Promise<FriendWithUser[]> {
  return query<FriendWithUser>(
    `SELECT f.*, f.requester_id as user_id, u.nickname, u.avatar, u.gender
     FROM friendships f
     INNER JOIN users u ON u.id = f.requester_id
     WHERE f.addressee_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId],
  );
}

export async function deleteFriendship(userId1: string, userId2: string): Promise<void> {
  await query(
    `DELETE FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [userId1, userId2],
  );
}
