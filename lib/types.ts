import * as z from "zod";
import {
  MAX_MLS_CHAR_LIMIT,
  MIN_MLS_CHAR_LIMIT,
  OUTPUT_KEYS,
  PROPERTY_TYPE_VALUES,
  TONE_VALUES,
  type OutputKey,
} from "./options";

/** Listing details as entered in the form. Numbers stay strings so empty fields are simply "". */
export const ListingSchema = z.object({
  address: z.string().trim().max(200),
  city: z.string().trim().min(1, "City/town is required.").max(100),
  propertyType: z.enum(PROPERTY_TYPE_VALUES),
  price: z.string().trim().max(20),
  beds: z.string().trim().max(10),
  baths: z.string().trim().max(10),
  sqft: z.string().trim().max(15),
  lotSize: z.string().trim().max(60),
  yearBuilt: z.string().trim().max(10),
  features: z.array(z.string().trim().max(60)).max(40),
  otherFeatures: z.string().trim().max(1500),
  locationHighlights: z.string().trim().max(1500),
  agentNotes: z.string().trim().max(5000),
  tone: z.enum(TONE_VALUES),
});

export type Listing = z.infer<typeof ListingSchema>;

const previousText = z.string().max(8000).optional();

export const GenerateRequestSchema = z.object({
  listing: ListingSchema,
  outputs: z.array(z.enum(OUTPUT_KEYS)).min(1, "Pick at least one output.").max(OUTPUT_KEYS.length),
  mlsCharLimit: z.number().int().min(MIN_MLS_CHAR_LIMIT).max(MAX_MLS_CHAR_LIMIT),
  /** Current text of a card being regenerated, so the model writes a fresh alternative. */
  previous: z
    .object({
      mls: previousText,
      social: previousText,
      email: previousText,
      headlines: previousText,
      openHouse: previousText,
    })
    .optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

/** Per-output JSON shapes. The model's response schema is built from the requested subset. */
export const OUTPUT_SCHEMAS = {
  mls: z.string().describe("MLS public remarks, plain text, at or under the character limit."),
  social: z.string().describe("Instagram/Facebook caption with emojis, ending with 5-8 hashtags."),
  email: z
    .object({
      subject: z.string().describe("Email subject line, under 60 characters."),
      body: z.string().describe("Email body with a call to action to schedule a showing."),
    })
    .describe("Email blast."),
  headlines: z.array(z.string()).describe("Exactly 3 distinct headline options."),
  openHouse: z.string().describe("Open house blurb, 2-3 sentences."),
} satisfies Record<OutputKey, z.ZodType>;

export type EmailOutput = { subject: string; body: string };

export type GeneratedOutputs = {
  mls?: string;
  social?: string;
  email?: EmailOutput;
  headlines?: string[];
  openHouse?: string;
};

export type GenerateResponse = {
  outputs: GeneratedOutputs;
  meta: {
    model: string;
    mock: boolean;
    /** Set when the server had to shorten the MLS draft to fit the limit. */
    mlsAdjusted?: "shortened" | "trimmed";
  };
};

export type GenerateErrorResponse = { error: string };

export function buildOutputSchema(keys: readonly OutputKey[]) {
  const shape: Partial<Record<OutputKey, z.ZodType>> = {};
  for (const key of keys) shape[key] = OUTPUT_SCHEMAS[key];
  return z.object(shape as Record<string, z.ZodType>).strict();
}
