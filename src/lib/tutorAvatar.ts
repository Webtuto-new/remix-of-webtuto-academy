// Returns a stable cartoon/illustrated placeholder avatar URL for a tutor when no
// real photo is set. Uses DiceBear "avataaars" (cartoon-style) seeded by tutor
// name so each tutor gets a unique character that stays the same across renders.
// Gender comes from teachers.gender. Skin tone is fixed (we don't vary skin color).

export type TutorLike = {
  avatar_url?: string | null;
  name?: string | null;
  gender?: string | null;
  id?: string | null;
};

// Fixed skin tone for ALL generated avatars (no skin-color variation).
const FIXED_SKIN = "light";

// avataaars option pools used to vary characters by gender while keeping
// skin tone constant. Values are DiceBear avataaars options.
const MALE_TOPS = ["shortHair", "shortFlat", "shortRound", "shortWaved", "theCaesar", "shortCurly"];
const FEMALE_TOPS = ["longHair", "longHairStraight", "longHairCurly", "longHairBob", "longHairCurvy", "longHairBigHair"];
const FACIAL_HAIR_MALE = ["beardLight", "beardMedium", "blank", "blank", "blank"]; // mostly clean-shaven
const HAIR_COLORS = ["auburn", "black", "brown", "brownDark", "blonde"];
const CLOTHING = ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "shirtCrewNeck"];
const EYE_TYPES = ["default", "happy", "wink", "squint"];
const MOUTH_TYPES = ["smile", "default", "twinkle"];

const pick = <T,>(arr: T[], seed: number, salt: number) =>
  arr[Math.abs((seed * 31 + salt) | 0) % arr.length];

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const getTutorAvatar = (t: TutorLike): string => {
  if (t?.avatar_url) return t.avatar_url;
  const isFemale = (t?.gender || "male").toLowerCase() === "female";
  const seedStr = (t?.name || t?.id || "tutor").trim();
  const seed = encodeURIComponent(`${isFemale ? "f" : "m"}-${seedStr}`);
  // "lorelei" = clean, elegant illustrated portraits (close to the reference).
  // Gender split: female -> lorelei, male -> notionists-neutral (short hair, refined).
  const style = isFemale ? "lorelei" : "notionists";
  const params = `seed=${seed}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf,d1f4d1,e0e7ff,fde68a&radius=50`;
  return `https://api.dicebear.com/7.x/${style}/svg?${params}`;
};