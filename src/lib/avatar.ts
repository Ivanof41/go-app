export const AVATAR_MAX_BYTES = 500_000;

export function isValidAvatarDataUrl(value: string): boolean {
  return /^data:image\/(webp|jpeg|png);base64,/.test(value) && value.length <= AVATAR_MAX_BYTES;
}
