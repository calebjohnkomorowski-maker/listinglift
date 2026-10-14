import type { Listing } from "./types";

/**
 * A realistic demo listing: 4 bed / 2.5 bath colonial in a Chester County, PA suburb.
 * The agent notes are deliberately messy and include things that must NOT make it into public
 * copy (seller motivation, lockbox, "great for families"). That lets the demo show off the
 * privacy and Fair Housing handling.
 */
export const SAMPLE_LISTING: Listing = {
  address: "214 Hawthorne Lane",
  city: "Malvern, PA",
  propertyType: "single-family",
  price: "749900",
  beds: "4",
  baths: "2.5",
  sqft: "2640",
  lotSize: "0.52 acres",
  yearBuilt: "1994",
  features: [
    "Updated kitchen",
    "Hardwood floors",
    "Finished basement",
    "Garage",
    "Fireplace",
    "Primary suite",
    "Deck/patio",
    "Central air",
    "New roof",
    "First-floor laundry",
  ],
  otherFeatures:
    "Center-hall colonial. 2-car attached garage. Gas fireplace in the family room. Walk-in closet + double vanity in primary bath. Trex deck off the kitchen.",
  locationHighlights:
    "Cul-de-sac street. About 5 minutes to Route 202 and the Paoli train station. Close to the Chester Valley Trail and the shops and restaurants on King Street in downtown Malvern. Great Valley School District.",
  agentNotes: `kitchen redone 2021 - quartz counters, SS appliances, big island w/ seating, pantry
roof 2022, HVAC 2019
hardwoods thru whole 1st floor, refinished last yr
bsmt finished 2018 - rec room + office nook + lots of storage
flat backyard backs to trees, very private
sellers relocating for work, motivated!! (don't put in listing)
great neighborhood for families, tons of kids on the street
showings start Fri, lockbox on side door`,
  tone: "warm",
};
