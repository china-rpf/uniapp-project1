/**
 * 多样化头像系统
 * gender: 0=未设置, 1=男, 2=女
 * 根据 userId 哈希确定性选择不同的 emoji 和背景色
 */

const MALE_EMOJIS = ['👦', '🧑', '👨‍🎓', '🧑‍💻'];
const FEMALE_EMOJIS = ['👧', '👩', '👩‍🎓', '👩‍💻'];
const DEFAULT_EMOJIS = ['😊', '🙂', '😄', '🤗'];

const MALE_COLORS = ['#E3F2FD', '#BBDEFB', '#D1C4E9', '#C5CAE9'];
const FEMALE_COLORS = ['#FCE4EC', '#F8BBD0', '#F3E5F5', '#FFE0B2'];
const DEFAULT_COLORS = ['#E8F5E9', '#C8E6C9', '#DCEDC8', '#F0F4C3'];

function hashId(id?: string | null): number {
  if (!id) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarBgColor(gender?: number | null, userId?: string | null): string {
  const idx = hashId(userId) % 4;
  switch (gender) {
    case 1: return MALE_COLORS[idx];
    case 2: return FEMALE_COLORS[idx];
    default: return DEFAULT_COLORS[idx];
  }
}

export function getAvatarEmoji(gender?: number | null, userId?: string | null): string {
  const idx = hashId(userId) % 4;
  switch (gender) {
    case 1: return MALE_EMOJIS[idx];
    case 2: return FEMALE_EMOJIS[idx];
    default: return DEFAULT_EMOJIS[idx];
  }
}

export function getDefaultAvatar(_gender?: number | null): string {
  return '/static/default-avatar.png';
}
