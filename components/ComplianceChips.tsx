"use client";

import { applyReplacement, type ComplianceFlag } from "@/lib/fairHousing";
import type { FlaggedTerm } from "@/lib/fairHousingTerms";
import { AlertIcon, ShieldCheckIcon } from "./Icons";

type Props = {
  flags: ComplianceFlag[];
  onReplace: (term: FlaggedTerm) => void;
};

export default function ComplianceChips({ flags, onReplace }: Props) {
  if (flags.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-brand-700">
        <ShieldCheckIcon width={14} height={14} />
        Fair Housing check: no flagged terms
      </p>
    );
  }

  return (
    <div aria-live="polite">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-800">
        <AlertIcon width={14} height={14} />
        Fair Housing check: {flags.length} {flags.length === 1 ? "phrase" : "phrases"} to review
      </p>
      <ul className="flex flex-wrap gap-2">
        {flags.map(({ key, term, match }) => (
          <li
            key={key}
            title={`${term.category}: ${term.reason}`}
            className="flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900"
          >
            <span className="font-semibold">“{match}”</span>
            <span className="text-amber-800">
              → {term.replacement ? `try “${applyReplacement(match, term)}”` : term.suggestion}
            </span>
            {term.replacement && (
              <button
                type="button"
                onClick={() => onReplace(term)}
                className="rounded-md bg-amber-200/70 px-1.5 py-0.5 font-medium text-amber-950 transition-colors hover:bg-amber-300"
              >
                Replace
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
