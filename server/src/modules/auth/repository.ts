import { query, queryOne } from '../../db/postgres';
import { UserRow } from '../../shared/types';
import { UpdateProfileInput } from './schema';

export async function findByOpenid(openid: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    'SELECT * FROM users WHERE wx_openid = $1',
    [openid],
  );
}

export async function findById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    'SELECT * FROM users WHERE id = $1',
    [id],
  );
}

export async function createUser(openid: string): Promise<UserRow> {
  const rows = await query<UserRow>(
    'INSERT INTO users (wx_openid) VALUES ($1) RETURNING *',
    [openid],
  );
  return rows[0];
}

export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<UserRow | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return findById(userId);

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  return queryOne<UserRow>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );
}
