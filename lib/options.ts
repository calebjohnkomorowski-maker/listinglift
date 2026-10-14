export const PROPERTY_TYPES = [
  { value: "single-family", label: "Single family" },
  { value: "townhouse", label: "Townhouse" },
  { value: "condo", label: "Condo" },
  { value: "multi-family", label: "Multi-family" },
  { value: "land", label: "Land" },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];
export const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((t) => t.value) as [
  PropertyType,
  ...PropertyType[],
];

export const FEATURE_OPTIONS = [
  "Updated kitchen",
  "Hardwood floors",
  "Finished basement",
  "Garage",
  "Fireplace",
  "Primary suite",
  "Deck/patio",
  "Pool",
  "Central air",
  "New roof",
  "Open floor plan",
  "Updated baths",
  "Home office",
  "Walk-in closets",
  "First-floor laundry",
  "Fenced yard",
  "Screened porch",
  "Energy-efficient upgrades",
] as const;

export const TONES = [
  {
    value: "warm",
    label: "Warm & inviting",
    hint: "Welcoming, conversational, grounded in the home's everyday comforts.",
  },
  {
    value: "luxury",
    label: "Luxury",
    hint: "Refined and elevated. Craftsmanship, finishes, and setting.",
  },
  {
    value: "straightforward",
    label: "Straightforward",
    hint: "Clear and factual. Leads with the key specs.",
  },
  {
    value: "investor",
    label: "Investor-focused",
    hint: "Numbers, condition, and upside. Only from facts you provide.",
  },
] as const;

export type Tone = (typeof TONES)[number]["value"];
export const TONE_VALUES = TONES.map((t) => t.value) as [Tone, ...Tone[]];

export const OUTPUT_TYPES = [
  { key: "mls", label: "MLS description", hint: "Public remarks, kept under your character limit" },
  { key: "social", label: "Instagram / Facebook post", hint: "Emojis + 5–8 hashtags" },
  { key: "email", label: "Email blast", hint: "Subject line + body with a showing CTA" },
  { key: "headlines", label: "Headline options", hint: "3 short, punchy headlines" },
  { key: "openHouse", label: "Open house blurb", hint: "2–3 sentences" },
] as const;

export type OutputKey = (typeof OUTPUT_TYPES)[number]["key"];
export const OUTPUT_KEYS = OUTPUT_TYPES.map((o) => o.key) as [OutputKey, ...OutputKey[]];

export const DEFAULT_MLS_CHAR_LIMIT = 1000;
export const MIN_MLS_CHAR_LIMIT = 250;
export const MAX_MLS_CHAR_LIMIT = 5000;
