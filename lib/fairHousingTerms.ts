/**
 * Fair Housing flagged-terms list.
 *
 * This file drives two things:
 *   1. The client-side checker that shows a yellow warning chip on any output containing these terms.
 *   2. The "never use these phrases" list in the model's system prompt.
 *
 * Editing guide
 * - `phrases`: plain-text phrases. Matching is case-insensitive and whole-word, and spaces/hyphens are
 *   interchangeable ("family friendly" also matches "family-friendly"). These are also what the model
 *   is told to avoid.
 * - `regex` (optional): an advanced pattern used for matching instead of `phrases`. Use it when a
 *   plain phrase would cause false positives (e.g. "family room" is fine; "family-friendly" is not).
 *   When `regex` is set, `phrases` are still sent to the model as examples.
 * - `suggestion`: shown on the chip as a neutral alternative.
 * - `replacement` (optional): enables a one-click "Replace" on the chip. Supports $1-style groups
 *   from `regex`. Only set this when the swap is always safe.
 *
 * This list is a guardrail, not legal advice. It is intentionally conservative, and the agent is
 * responsible for the final review. Sources: HUD advertising guidance (24 CFR 100.75), and common
 * MLS/brokerage "words to avoid" lists.
 */

export type FairHousingCategory =
  | "Familial status"
  | "Age / household"
  | "Religion"
  | "Race / national origin"
  | "Disability"
  | "Sex / gender"
  | "Neighborhood characterization"
  | "Source of income"
  | "Best practice";

export type FlaggedTerm = {
  id: string;
  category: FairHousingCategory;
  phrases: string[];
  regex?: RegExp;
  suggestion: string;
  replacement?: string;
  reason: string;
};

export const FLAGGED_TERMS: FlaggedTerm[] = [
  // Familial status
  {
    id: "perfect-for-families",
    category: "Familial status",
    phrases: ["perfect for families", "ideal for families", "great for families", "perfect for a growing family"],
    regex: /\b(?:perfect|ideal|great|made|built|wonderful)\s+for\s+(?:a\s+|the\s+)?(?:(?:growing|young|large|busy|whole)\s+)?famil(?:y|ies)\b/i,
    suggestion: "Describe the space itself, e.g. “flexible layout with 4 bedrooms”",
    reason: "Describes who should live there (familial status).",
  },
  {
    id: "family-friendly",
    category: "Familial status",
    phrases: ["family-friendly", "family neighborhood", "family-oriented", "family community", "kid-friendly", "child-friendly"],
    regex: /\b(?:family[\s-](?:friendly|oriented|neighborhood|community|street|area)|kid[\s-]friendly|child[\s-]friendly)\b/i,
    suggestion: "Name the actual amenity: fenced yard, nearby park, cul-de-sac",
    reason: "Implies a preference based on familial status.",
  },
  {
    id: "growing-family",
    category: "Familial status",
    phrases: ["growing family", "young family", "large family"],
    suggestion: "Focus on size and layout: “room to spread out”",
    reason: "Describes the buyer's household instead of the property.",
  },
  {
    id: "kids-children",
    category: "Familial status",
    phrases: ["kids", "children", "no kids", "no children"],
    regex: /\b(?:kids?|children|child)\b(?!'s\s+hospital)/i,
    suggestion: "Describe the feature, e.g. “bonus room”, “level backyard”",
    reason: "References to children can signal a preference for or against familial status.",
  },
  // Age / household makeup
  {
    id: "adults-seniors",
    category: "Age / household",
    phrases: ["adults only", "adult community", "adult living", "mature adults", "seniors", "senior living", "elderly", "retirees", "empty nesters"],
    regex: /\b(?:adults?[\s-]only|adult\s+(?:community|living)|mature\s+(?:adults?|couples?|persons?|individuals?)|seniors?|senior\s+living|elderly|retirees|retired\s+couples?|empty[\s-]?nesters?)\b/i,
    suggestion: "Remove. Only legally qualified 55+/62+ communities may state age restrictions",
    reason: "Age and household-makeup descriptions can indicate a familial-status preference.",
  },
  {
    id: "buyer-profile",
    category: "Age / household",
    phrases: ["young professionals", "ideal for couples", "perfect for singles", "newlyweds", "bachelor pad", "ideal for students"],
    regex: /\b(?:(?:perfect|ideal|great)\s+for\s+(?:a\s+)?(?:young\s+)?(?:couples?|singles?|newlyweds|bachelors?|students|professionals)|young\s+(?:professionals?|couples?|people)|newlyweds|bachelor(?:'s)?\s+pad|singles)\b/i,
    suggestion: "Describe the home, not the buyer: “low-maintenance living”, “efficient layout”",
    reason: "Describing an ideal buyer implies a preference based on familial status, sex, or age.",
  },
  // Religion
  {
    id: "place-of-worship",
    category: "Religion",
    phrases: ["walking distance to church", "near church", "near synagogue", "near mosque", "near temple"],
    // Skips street names and other proper nouns like "Church Street" / "Temple University".
    regex: /\b(?:church(?:es)?|chapel|synagogue|mosque|temple|parish|cathedral)\b(?!\s+(?:st|street|rd|road|ave|avenue|ln|lane|dr|drive|way|ct|court|blvd|pike|hill|farm|university)\b)/i,
    suggestion: "Use neutral landmarks: parks, downtown, shopping, transit",
    reason: "Highlighting places of worship can signal a religious preference.",
  },
  {
    id: "religious-terms",
    category: "Religion",
    phrases: ["christian", "catholic", "jewish", "muslim", "hindu", "buddhist"],
    suggestion: "Remove religious references",
    reason: "Religion is a protected class.",
  },
  // Race / color / national origin
  {
    id: "race-national-origin",
    category: "Race / national origin",
    phrases: ["ethnic", "integrated neighborhood", "diverse neighborhood", "caucasian", "hispanic", "latino", "asian", "african american", "english only", "english-speaking"],
    regex: /\b(?:ethnic|integrated\s+(?:neighborhood|community|area)|diverse\s+(?:neighborhood|community|area)|(?:white|black)\s+(?:neighborhood|community|area|famil(?:y|ies))|caucasian|hispanic|latin[oax]|asian|african[\s-]american|english[\s-](?:only|speaking))\b/i,
    suggestion: "Remove. Describe the property and verifiable amenities only",
    reason: "Race, color, and national origin are protected classes.",
  },
  // Disability
  {
    id: "handicap",
    category: "Disability",
    phrases: ["handicap accessible", "handicapped"],
    regex: /\bhandicap(?:ped)?(?:[\s-]accessible)?\b/i,
    suggestion: "accessible",
    replacement: "accessible",
    reason: "Describe accessibility features, not people with disabilities.",
  },
  {
    id: "able-bodied",
    category: "Disability",
    phrases: ["able-bodied", "wheelchair-bound", "no wheelchairs", "physically fit"],
    regex: /\b(?:able[\s-]bodied|wheelchair[\s-]bound|no\s+wheelchairs|physically\s+fit)\b/i,
    suggestion: "Describe the feature: “zero-step entry”, “first-floor bedroom”",
    reason: "Refers to disability status rather than the property.",
  },
  // Sex / gender
  {
    id: "master-room",
    category: "Sex / gender",
    phrases: ["master bedroom", "master suite", "master bath"],
    regex: /\bmaster\s+(bedroom|suite|bath(?:room)?|closet|retreat|wing)\b/i,
    suggestion: "primary …",
    replacement: "primary $1",
    reason: "Most MLSs and brokerages now use “primary” as the neutral term.",
  },
  {
    id: "his-and-hers",
    category: "Sex / gender",
    phrases: ["his and hers", "his & hers"],
    regex: /\bhis\s*(?:and|&|'n'|n)\s*hers?\b/i,
    suggestion: "dual",
    replacement: "dual",
    reason: "Gendered language. “Dual vanities/closets” is neutral.",
  },
  {
    id: "man-cave",
    category: "Sex / gender",
    phrases: ["man cave"],
    regex: /\bman[\s-]cave\b/i,
    suggestion: "bonus room",
    replacement: "bonus room",
    reason: "Gendered language.",
  },
  {
    id: "gendered-other",
    category: "Sex / gender",
    phrases: ["mother-in-law suite", "gentleman's farm", "sportsman's paradise"],
    regex: /\b(?:mother[\s-]in[\s-]law|gentleman'?s\s+farm|sportsman'?s\s+paradise)\b/i,
    suggestion: "“in-law suite”, “hobby farm”, “outdoor recreation”",
    reason: "Gendered language.",
  },
  // Neighborhood characterization
  {
    id: "safe-neighborhood",
    category: "Neighborhood characterization",
    phrases: ["safe neighborhood", "safe area", "low crime", "crime-free", "secure neighborhood"],
    regex: /\b(?:safe(?:st)?\s+(?:neighborhood|area|community|street|location|place|block|town)|low[\s-]crime|crime[\s-]free|secure\s+(?:neighborhood|community|area))\b/i,
    suggestion: "Name concrete features: “gated entry”, “security system”, “cul-de-sac”",
    reason: "Safety claims about a neighborhood can be read as coded references to its residents.",
  },
  {
    id: "exclusive",
    category: "Neighborhood characterization",
    phrases: ["exclusive neighborhood", "exclusive community", "restricted community"],
    regex: /\b(?:exclusive|restricted)\s+(?:neighborhood|community|enclave|area|location|street|subdivision|development|address)\b/i,
    suggestion: "“sought-after location” or name the specific amenity",
    reason: "“Exclusive”/“restricted” can imply that some people are unwelcome.",
  },
  // Source of income (protected in many states and cities)
  {
    id: "source-of-income",
    category: "Source of income",
    phrases: ["no section 8", "no vouchers"],
    regex: /\bno\s+(?:section[\s-]?8|vouchers?|housing\s+assistance)\b/i,
    suggestion: "Remove. Source of income is protected in many states and cities",
    reason: "Source-of-income discrimination is illegal in many jurisdictions.",
  },
  // Best practice
  {
    id: "school-quality",
    category: "Best practice",
    phrases: ["great schools", "best schools", "top schools", "excellent schools"],
    regex: /\b(?:great|good|best|top|excellent|top[\s-]rated)\s+schools?\b/i,
    suggestion: "State it factually: “located in the ___ School District”",
    reason: "Subjective school claims can imply a familial-status preference and are hard to verify.",
  },
];

/** Flat list of phrases to avoid, used in the system prompt. */
export const FLAGGED_PHRASES_FOR_PROMPT: string[] = Array.from(
  new Set(FLAGGED_TERMS.flatMap((t) => t.phrases)),
);
