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
  const h = hashString(seedStr);

  const top = isFemale ? pick(FEMALE_TOPS, h, 1) : pick(MALE_TOPS, h, 1);
  const facialHair = isFemale ? "blank" : pick(FACIAL_HAIR_MALE, h, 2);
  const hairColor = pick(HAIR_COLORS, h, 3);
  const clothing = pick(CLOTHING, h, 4);
  const eyes = pick(EYE_TYPES, h, 5);
  const mouth = pick(MOUTH_TYPES, h, 6);

  const params = new URLSearchParams({
    seed: seedStr,
    backgroundColor: "b6e3f4,c0aede,ffd5dc,ffdfbf,d1f4d1",
    skinColor: FIXED_SKIN,
    top,
    facialHair,
    hairColor,
    clothing,
    eyes,
    mouth,
    radius: "50",
  });
  return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
};