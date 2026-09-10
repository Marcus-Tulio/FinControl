export const AVATAR_ICON_KEYS = Array.from({ length: 15 }, (_, i) => String(i + 1));

export function avatarIconSrc(key: string): string {
  return `/avatars/avatar-${key}.png`;
}
