import { query, queryOne, pool } from '../../db/postgres';

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: string;
  content: string;
  reply_to_id: string | null;
  recalled: boolean;
  metadata: { filename?: string; size?: number } | null;
  created_at: Date;
}

export interface ConversationRow {
  id: string;
  type: string;
  class_id: string | null;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationParticipantRow {
  id: string;
  conversation_id: string;
  user_id: string;
  unread_count: number;
  muted: boolean;
  created_at: Date;
  updated_at: Date;
}

// Conversations
export async function findConversationById(id: string): Promise<ConversationRow | null> {
  return queryOne<ConversationRow>('SELECT * FROM conversations WHERE id = $1', [id]);
}

export async function findClassConversation(classId: string): Promise<ConversationRow | null> {
  return queryOne<ConversationRow>(
    'SELECT * FROM conversations WHERE class_id = $1 AND type = $2',
    [classId, 'group'],
  );
}

export async function findPrivateConversation(userId1: string, userId2: string): Promise<ConversationRow | null> {
  return queryOne<ConversationRow>(
    `SELECT c.* FROM conversations c
     INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
     INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
     WHERE c.type = 'private'
       AND cp1.user_id = $1
       AND cp2.user_id = $2`,
    [userId1, userId2],
  );
}

export async function createConversation(
  type: string,
  classId?: string,
): Promise<ConversationRow> {
  const rows = await query<ConversationRow>(
    `INSERT INTO conversations (type, class_id) VALUES ($1, $2) RETURNING *`,
    [type, classId || null],
  );
  return rows[0];
}

export async function addParticipant(
  conversationId: string,
  userId: string,
): Promise<ConversationParticipantRow> {
  const rows = await query<ConversationParticipantRow>(
    `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2) RETURNING *`,
    [conversationId, userId],
  );
  return rows[0];
}

export async function isParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const result = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2)`,
    [conversationId, userId],
  );
  return result?.exists || false;
}

export async function listUserConversations(userId: string): Promise<any[]> {
  return query(
    `SELECT c.*, cp.unread_count, cp.muted,
       (SELECT content FROM messages WHERE conversation_id = c.id AND recalled = false ORDER BY created_at DESC LIMIT 1) as last_message,
       (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
     FROM conversations c
     INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
     WHERE cp.user_id = $1
     ORDER BY c.last_message_at DESC NULLS LAST`,
    [userId],
  );
}

// Messages
export async function createMessage(
  conversationId: string,
  senderId: string,
  type: string,
  content: string,
  replyToId?: string,
  metadata?: { filename?: string; size?: number } | null,
): Promise<MessageRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert message
    const msgResult = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, type, content, reply_to_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [conversationId, senderId, type, content, replyToId || null, metadata ? JSON.stringify(metadata) : null],
    );
    const message = msgResult.rows[0] as MessageRow;

    // Update conversation last_message_at
    await client.query(
      `UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );

    // Increment unread count for all other participants
    await client.query(
      `UPDATE conversation_participants
       SET unread_count = unread_count + 1, updated_at = NOW()
       WHERE conversation_id = $1 AND user_id != $2`,
      [conversationId, senderId],
    );

    await client.query('COMMIT');
    return message;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit = 20,
): Promise<any[]> {
  const baseQuery = `
    SELECT m.*,
      json_build_object('nickname', COALESCE(u.nickname, '用户'), 'avatar', u.avatar, 'gender', u.gender) AS sender
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = $1`;

  if (cursor) {
    return query(
      `${baseQuery} AND m.created_at < (SELECT created_at FROM messages WHERE id = $2)
       ORDER BY m.created_at DESC LIMIT $3`,
      [conversationId, cursor, limit],
    );
  }
  return query(
    `${baseQuery} ORDER BY m.created_at DESC LIMIT $2`,
    [conversationId, limit],
  );
}

export async function recallMessage(messageId: string, userId: string): Promise<MessageRow | null> {
  return queryOne<MessageRow>(
    `UPDATE messages SET recalled = true
     WHERE id = $1 AND sender_id = $2 AND created_at > NOW() - INTERVAL '2 minutes'
     RETURNING *`,
    [messageId, userId],
  );
}

export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  await query(
    `UPDATE conversation_participants SET unread_count = 0, updated_at = NOW()
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId],
  );
}

// Get sender info for message broadcast
export async function getSenderInfo(userId: string): Promise<{ nickname: string; avatar: string | null; gender: number }> {
  const result = await queryOne<{ nickname: string | null; avatar: string | null; gender: number | null }>(
    'SELECT nickname, avatar, gender FROM users WHERE id = $1',
    [userId],
  );
  return { nickname: result?.nickname || '用户', avatar: result?.avatar || null, gender: result?.gender || 0 };
}
