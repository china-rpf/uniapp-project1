import { query, queryOne } from '../../db/postgres';
import { ClassRow, ClassMemberRow } from '../../shared/types';
import { CreateClassInput, UpdateClassInput } from './schema';
import { pool } from '../../db/postgres';

export async function findById(id: string): Promise<ClassRow | null> {
  return queryOne<ClassRow>('SELECT * FROM classes WHERE id = $1', [id]);
}

export async function findByInviteCode(code: string): Promise<ClassRow | null> {
  return queryOne<ClassRow>('SELECT * FROM classes WHERE invite_code = $1', [code]);
}

export async function createClass(
  data: CreateClassInput,
  creatorId: string,
  inviteCode: string,
  assembleDeadline: Date,
): Promise<ClassRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create class
    const classResult = await client.query(
      `INSERT INTO classes (name, creator_id, invite_code, min_members, max_members, grade_tag, assemble_deadline, current_members)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1) RETURNING *`,
      [data.name, creatorId, inviteCode, data.min_members, data.max_members, data.grade_tag || null, assembleDeadline],
    );
    const newClass = classResult.rows[0] as ClassRow;

    // Add creator as member with 'creator' role
    await client.query(
      `INSERT INTO class_members (class_id, user_id, role, join_method, status)
       VALUES ($1, $2, 'creator', 'create', 'active')`,
      [newClass.id, creatorId],
    );

    await client.query('COMMIT');
    return newClass;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listPublicClasses(
  status: string | undefined,
  page: number,
  limit: number,
): Promise<{ classes: ClassRow[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [classes, countResult] = await Promise.all([
    query<ClassRow>(
      `SELECT * FROM classes ${where} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM classes ${where}`,
      params,
    ),
  ]);

  return { classes, total: parseInt(countResult[0]?.count || '0', 10) };
}

export async function listUserClasses(userId: string): Promise<ClassRow[]> {
  return query<ClassRow>(
    `SELECT c.* FROM classes c
     INNER JOIN class_members cm ON c.id = cm.class_id
     WHERE cm.user_id = $1 AND cm.status = 'active'
     ORDER BY c.created_at DESC`,
    [userId],
  );
}

export async function incrementMembers(classId: string): Promise<ClassRow | null> {
  return queryOne<ClassRow>(
    `UPDATE classes SET current_members = current_members + 1, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [classId],
  );
}

export async function updateStatus(classId: string, status: string): Promise<ClassRow | null> {
  return queryOne<ClassRow>(
    `UPDATE classes SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, classId],
  );
}

export async function updateClass(id: string, data: UpdateClassInput): Promise<ClassRow | null> {
  const fields: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name); }
  if (data.min_members !== undefined) { fields.push(`min_members = $${idx++}`); params.push(data.min_members); }
  if (data.max_members !== undefined) { fields.push(`max_members = $${idx++}`); params.push(data.max_members); }
  if (data.grade_tag !== undefined) { fields.push(`grade_tag = $${idx++}`); params.push(data.grade_tag || null); }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  params.push(id);

  return queryOne<ClassRow>(
    `UPDATE classes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params,
  );
}

export async function deleteClass(id: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete conversation participants for class conversations
    await client.query(
      `DELETE FROM conversation_participants WHERE conversation_id IN
       (SELECT id FROM conversations WHERE class_id = $1)`,
      [id],
    );

    // Delete messages in class conversations
    await client.query(
      `DELETE FROM messages WHERE conversation_id IN
       (SELECT id FROM conversations WHERE class_id = $1)`,
      [id],
    );

    // Delete class conversations
    await client.query('DELETE FROM conversations WHERE class_id = $1', [id]);

    // Delete class members
    await client.query('DELETE FROM class_members WHERE class_id = $1', [id]);

    // Delete the class
    await client.query('DELETE FROM classes WHERE id = $1', [id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function countUserClasses(userId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM class_members WHERE user_id = $1 AND status = 'active'`,
    [userId],
  );
  return parseInt(result?.count || '0', 10);
}
