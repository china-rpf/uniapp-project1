import { query, queryOne } from '../../db/postgres';
import { ClassMemberRow } from '../../shared/types';

export async function findMember(classId: string, userId: string): Promise<ClassMemberRow | null> {
  return queryOne<ClassMemberRow>(
    'SELECT * FROM class_members WHERE class_id = $1 AND user_id = $2',
    [classId, userId],
  );
}

export async function addMember(
  classId: string,
  userId: string,
  joinMethod: string = 'invite',
): Promise<ClassMemberRow> {
  const rows = await query<ClassMemberRow>(
    `INSERT INTO class_members (class_id, user_id, role, join_method, status)
     VALUES ($1, $2, 'member', $3, 'active') RETURNING *`,
    [classId, userId, joinMethod],
  );
  return rows[0];
}

export async function listMembers(classId: string): Promise<ClassMemberRow[]> {
  return query<ClassMemberRow>(
    `SELECT cm.*, u.nickname, u.avatar, u.gender FROM class_members cm
     INNER JOIN users u ON cm.user_id = u.id
     WHERE cm.class_id = $1 AND cm.status = 'active'
     ORDER BY cm.created_at ASC`,
    [classId],
  );
}

export async function updateRole(
  classId: string,
  userId: string,
  role: string,
): Promise<ClassMemberRow | null> {
  return queryOne<ClassMemberRow>(
    `UPDATE class_members SET role = $1, updated_at = NOW()
     WHERE class_id = $2 AND user_id = $3 RETURNING *`,
    [role, classId, userId],
  );
}

export async function removeMember(classId: string, userId: string): Promise<void> {
  await query(
    `UPDATE class_members SET status = 'left', updated_at = NOW()
     WHERE class_id = $1 AND user_id = $2`,
    [classId, userId],
  );
}
