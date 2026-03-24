// Class constraints
export const CLASS_MIN_MEMBERS_LOWER = 2;
export const CLASS_MIN_MEMBERS_DEFAULT = 15;
export const CLASS_MAX_MEMBERS_UPPER = 60;
export const CLASS_MAX_MEMBERS_DEFAULT = 50;
export const CLASS_ASSEMBLE_DAYS = 7;
export const USER_MAX_CLASSES = 5;

// Class status
export const CLASS_STATUS = {
  ASSEMBLING: 'assembling',
  ACTIVE: 'active',
  DISSOLVED: 'dissolved',
} as const;

// Member roles
export const MEMBER_ROLE = {
  CREATOR: 'creator',
  TEACHER: 'teacher',
  MONITOR: 'monitor',
  COMMITTEE: 'committee',
  MEMBER: 'member',
} as const;

// User status
export const USER_STATUS = {
  ACTIVE: 'active',
  BANNED: 'banned',
} as const;
