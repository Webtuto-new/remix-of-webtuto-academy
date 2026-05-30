// Returns a stable placeholder avatar URL for a tutor when no real photo is set.
// Uses randomuser.me portraits (real-looking faces) seeded by name so the same tutor
// always shows the same face. Gender comes from the teachers.gender column.

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export type TutorLike = {
  avatar_url?: string | null;
  name?: string | null;
  gender?: string | null;
  id?: string | null;
};

export const getTutorAvatar = (t: TutorLike): string => {
  if (t?.avatar_url) return t.avatar_url;
  const gender = (t?.gender || "male").toLowerCase() === "female" ? "women" : "men";
  const seed = (t?.name || t?.id || "tutor").trim();
  const idx = hashString(seed) % 100; // 0..99
  return `https://randomuser.me/api/portraits/${gender}/${idx}.jpg`;
};