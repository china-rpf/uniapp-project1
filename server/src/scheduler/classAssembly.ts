import { query } from '../db/postgres';
import { CLASS_STATUS, CLASS_MIN_MEMBERS_LOWER } from '../shared/constants';
import { emitToClass } from '../socket';

interface ExpiringClass {
  id: string;
  name: string;
  current_members: number;
  min_members: number;
}

/**
 * Check for expired assembling classes and handle them:
 * - If members >= 10 (absolute minimum): downgrade to active with lower capacity
 * - If members < 10: dissolve the class
 */
export async function processExpiredClasses(): Promise<{ activated: string[]; dissolved: string[] }> {
  const now = new Date();

  // Find expired assembling classes
  const expiredClasses = await query<ExpiringClass>(
    `SELECT id, name, current_members, min_members
     FROM classes
     WHERE status = $1 AND assemble_deadline < $2`,
    [CLASS_STATUS.ASSEMBLING, now],
  );

  const activated: string[] = [];
  const dissolved: string[] = [];

  for (const cls of expiredClasses) {
    if (cls.current_members >= CLASS_MIN_MEMBERS_LOWER) {
      // Downgrade to active (reached absolute minimum)
      await query(
        `UPDATE classes SET status = $1, min_members = $2, updated_at = NOW() WHERE id = $3`,
        [CLASS_STATUS.ACTIVE, CLASS_MIN_MEMBERS_LOWER, cls.id],
      );
      activated.push(cls.id);

      // Notify members
      emitToClass(cls.id, 'class:assembled', {
        classId: cls.id,
        message: `班级「${cls.name}」已成功组建！当前 ${cls.current_members} 名同学`,
      });

      console.log(`[Scheduler] Class ${cls.id} activated with ${cls.current_members} members`);
    } else {
      // Dissolve the class
      await query(
        `UPDATE classes SET status = $1, updated_at = NOW() WHERE id = $2`,
        [CLASS_STATUS.DISSOLVED, cls.id],
      );
      dissolved.push(cls.id);

      // Notify members
      emitToClass(cls.id, 'class:dissolved', {
        classId: cls.id,
        message: `班级「${cls.name}」因人数不足已解散`,
      });

      console.log(`[Scheduler] Class ${cls.id} dissolved with ${cls.current_members} members`);
    }
  }

  return { activated, dissolved };
}

/**
 * Start the scheduler to run every minute
 */
export function startClassAssemblyScheduler(): NodeJS.Timeout {
  // Run immediately on start
  processExpiredClasses().catch(console.error);

  // Then run every 60 seconds
  const interval = setInterval(() => {
    processExpiredClasses().catch(console.error);
  }, 60 * 1000);

  console.log('[Scheduler] Class assembly scheduler started (runs every 60s)');
  return interval;
}
