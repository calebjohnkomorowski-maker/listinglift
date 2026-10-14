import { trimToLimit } from "./generate";
import { PROPERTY_TYPES } from "./options";
import type { GenerateRequest, GenerateResponse, GeneratedOutputs } from "./types";

/**
 * Mock mode (LISTINGLIFT_MOCK=1): template-based copy built from the form, no API call.
 * Lets you demo or develop the UI without an API key. The copy is intentionally simple.
 */
export async function generateMock(req: GenerateRequest): Promise<GenerateResponse> {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
  const l = req.listing;
  const type = PROPERTY_TYPES.find((t) => t.value === l.propertyType)?.label.toLowerCase() ?? "home";
  const town = l.city.split(",")[0];
  const price = /^\d+$/.test(l.price) ? `$${Number(l.price).toLocaleString("en-US")}` : l.price;
  const sqft = /^\d+$/.test(l.sqft) ? Number(l.sqft).toLocaleString("en-US") : l.sqft;
  const specs = [
    l.beds && `${l.beds} bedrooms`,
    l.baths && `${l.baths} baths`,
    sqft && `${sqft} sq ft`,
  ].filter(Boolean);
  const features = l.features.slice(0, 5).map((f) => f.toLowerCase());
  const where = l.address ? `${l.address}, ${l.city}` : l.city;
  const variant = req.previous ? " (alternate version)" : "";

  const all: GeneratedOutputs = {
    mls: `This ${specs.length ? `${specs.join(", ")} ` : ""}${type} in ${town} pairs thoughtful updates with an easy, livable layout${variant}. ${
      features.length ? `Highlights include ${features.join(", ")}.` : ""
    } ${l.otherFeatures ? l.otherFeatures : ""} ${l.lotSize ? `The ${l.lotSize} lot adds room to spread out.` : ""} ${
      l.locationHighlights ? `Location: ${l.locationHighlights}` : ""
    }`
      .replace(/\s+/g, " ")
      .trim(),
    social: `✨ Just listed in ${town}!${variant}\n\n🏡 ${specs.join(" · ") || type}\n${
      features.length ? `🔑 ${features.slice(0, 3).join(", ")}\n` : ""
    }${price ? `💰 ${price}\n` : ""}\nMessage me for details or a private showing.\n\n#JustListed #${town.replace(/\W/g, "")}RealEstate #HomeForSale #NewListing #RealEstate #HouseHunting`,
    email: {
      subject: `New listing in ${town}${price ? ` · ${price}` : ""}`,
      body: `Hi there,\n\nA new ${type} just hit the market at ${where}${variant}.\n\n${[
        ...specs,
        ...features.slice(0, 3),
      ]
        .slice(0, 5)
        .map((s) => `• ${s}`)
        .join("\n")}\n\n${price ? `Offered at ${price}. ` : ""}Reply to this email or call to schedule your private showing.\n\n[Your Name]\n[Phone] · [Email]`,
    },
    headlines: [
      `${specs[0] ?? "Updated"} ${type} in ${town}`,
      features[0] ? `${features[0][0].toUpperCase()}${features[0].slice(1)}, move-in ready` : "Move-in ready",
      `Room to grow in ${town}`,
    ],
    openHouse: `Join us for an open house at ${where} on [Day, Date] from [Time]. Tour this ${type}${
      features.length ? ` featuring ${features.slice(0, 2).join(" and ")}` : ""
    }. No appointment needed.`,
  };

  const outputs: GeneratedOutputs = {};
  for (const key of req.outputs) Object.assign(outputs, { [key]: all[key] });
  if (outputs.mls) outputs.mls = trimToLimit(outputs.mls, req.mlsCharLimit);
  return { outputs, meta: { model: "mock", mock: true } };
}
