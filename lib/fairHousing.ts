import { FLAGGED_TERMS, type FlaggedTerm } from "./fairHousingTerms";

export type ComplianceFlag = {
  key: string;
  term: FlaggedTerm;
  /** The exact text that matched, as it appears in the output. */
  match: string;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Plain phrases → one case-insensitive, whole-word regex where spaces and hyphens are interchangeable. */
function phrasesToRegex(phrases: string[]): RegExp {
  const alternatives = phrases
    .map((p) => escapeRegex(p.trim().toLowerCase()).replace(/[\s-]+/g, "[\\s-]+"))
    .sort((a, b) => b.length - a.length);
  return new RegExp(`(?<![\\w-])(?:${alternatives.join("|")})(?![\\w-])`, "i");
}

const COMPILED = FLAGGED_TERMS.map((term) => ({
  term,
  source: (term.regex ?? phrasesToRegex(term.phrases)).source,
}));

function globalRegex(source: string) {
  return new RegExp(source, "gi");
}

/** Scan text for flagged Fair Housing terms. One flag per distinct term + matched phrase. */
export function checkFairHousing(text: string): ComplianceFlag[] {
  if (!text.trim()) return [];
  const hits: { term: FlaggedTerm; match: string; start: number; end: number }[] = [];
  for (const { term, source } of COMPILED) {
    for (const m of text.matchAll(globalRegex(source))) {
      hits.push({ term, match: m[0], start: m.index, end: m.index + m[0].length });
    }
  }
  // Drop matches nested inside a longer match ("growing family" within "ideal for a growing family").
  const outer = hits.filter(
    (h) => !hits.some((o) => o !== h && o.start <= h.start && o.end >= h.end && o.end - o.start > h.end - h.start),
  );
  const flags = new Map<string, ComplianceFlag>();
  for (const { term, match } of outer) {
    const key = `${term.id}:${match.toLowerCase()}`;
    if (!flags.has(key)) flags.set(key, { key, term, match });
  }
  return [...flags.values()];
}

/** Apply a term's one-click replacement to every occurrence in `text`, preserving leading capitalization. */
export function applyReplacement(text: string, term: FlaggedTerm): string {
  if (!term.replacement) return text;
  const source = COMPILED.find((c) => c.term.id === term.id)?.source;
  if (!source) return text;
  return text.replace(globalRegex(source), (...args: unknown[]) => {
    const match = args[0] as string;
    let out = term.replacement!.replace(/\$(\d)/g, (_, i: string) => {
      const group = args[Number(i)];
      return typeof group === "string" ? group : "";
    });
    if (/^[A-Z]/.test(match)) out = out.charAt(0).toUpperCase() + out.slice(1);
    return out;
  });
}
