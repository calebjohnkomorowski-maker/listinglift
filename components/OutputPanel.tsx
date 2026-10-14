"use client";

import { useMemo, type ReactNode } from "react";
import { applyReplacement, checkFairHousing } from "@/lib/fairHousing";
import type { FlaggedTerm } from "@/lib/fairHousingTerms";
import { OUTPUT_TYPES, TONES, type OutputKey, type Tone } from "@/lib/options";
import { outputToText } from "@/lib/outputText";
import type { GeneratedOutputs } from "@/lib/types";
import AutoTextarea from "./AutoTextarea";
import ComplianceChips from "./ComplianceChips";
import { AlertIcon, HouseIcon, SparkleIcon } from "./Icons";
import OutputCard, { CopyButton, SkeletonCard } from "./OutputCard";

export type OutputMeta = {
  mock: boolean;
  model: string;
  tone: Tone;
  mlsLimit: number;
  mlsAdjusted?: "shortened" | "trimmed";
};

type Props = {
  outputs: GeneratedOutputs | null;
  shownKeys: OutputKey[];
  meta: OutputMeta | null;
  loading: boolean;
  pendingKeys: OutputKey[];
  error: string | null;
  regenerating: Partial<Record<OutputKey, boolean>>;
  cardErrors: Partial<Record<OutputKey, string>>;
  onRetry: () => void;
  onTrySample: () => void;
  onRegenerate: (key: OutputKey) => void;
  onUpdate: (next: GeneratedOutputs) => void;
};

const titleFor = (key: OutputKey) => OUTPUT_TYPES.find((o) => o.key === key)!.label;

const editorClass =
  "block w-full resize-none rounded-lg border border-line bg-stone-50/50 px-3 py-2.5 text-[15px] leading-relaxed text-ink transition-colors hover:border-stone-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function OutputPanel(props: Props) {
  const { outputs, shownKeys, meta, loading, pendingKeys, error, onRetry, onTrySample } = props;

  if (loading) {
    return (
      <div className="space-y-4" aria-live="polite" aria-busy>
        <p className="flex items-center gap-2 text-sm text-muted">
          <span className="size-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" aria-hidden />
          Writing {pendingKeys.length} {pendingKeys.length === 1 ? "piece" : "pieces"} of copy. This usually takes 10–30 seconds.
        </p>
        {pendingKeys.map((k) => (
          <SkeletonCard key={k} title={titleFor(k)} />
        ))}
      </div>
    );
  }

  const errorBanner = error && (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
      <div className="flex gap-3">
        <AlertIcon className="mt-0.5 shrink-0 text-red-700" width={18} height={18} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-red-900">Couldn&apos;t generate copy</h3>
          <p className="mt-1 text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-900 ring-1 ring-red-200 transition-colors hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );

  if (!outputs) {
    return (
      <div className="space-y-4">
        {errorBanner}
        <EmptyState onTrySample={onTrySample} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorBanner}
      {meta && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>
            Tone: <span className="font-medium text-ink">{TONES.find((t) => t.value === meta.tone)?.label}</span>
          </span>
          <span aria-hidden>·</span>
          {meta.mock ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              Mock mode: template output, no AI call
            </span>
          ) : (
            <span>Edit anything below. Fair Housing checks update as you type.</span>
          )}
        </div>
      )}
      {shownKeys.map((k) => (
        <OutputBlock key={k} outputKey={k} {...props} outputs={outputs} />
      ))}
    </div>
  );
}

function OutputBlock({
  outputKey: k,
  outputs,
  meta,
  loading,
  regenerating,
  cardErrors,
  onRegenerate,
  onUpdate,
}: Props & { outputKey: OutputKey; outputs: GeneratedOutputs }) {
  const text = outputToText(k, outputs);
  const flags = useMemo(() => checkFairHousing(text), [text]);

  const replace = (term: FlaggedTerm) => {
    const fix = (s: string) => applyReplacement(s, term);
    if (k === "email" && outputs.email) {
      onUpdate({ ...outputs, email: { subject: fix(outputs.email.subject), body: fix(outputs.email.body) } });
    } else if (k === "headlines" && outputs.headlines) {
      onUpdate({ ...outputs, headlines: outputs.headlines.map(fix) });
    } else if (k === "mls" || k === "social" || k === "openHouse") {
      onUpdate({ ...outputs, [k]: fix(outputs[k] ?? "") });
    }
  };

  const limit = meta?.mlsLimit ?? 1000;
  const mlsLength = outputs.mls?.length ?? 0;
  const counterTone =
    mlsLength > limit ? "bg-red-50 text-red-800 ring-red-200" : mlsLength > limit * 0.95 ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-stone-100 text-muted ring-line";

  let body: ReactNode;
  switch (k) {
    case "email":
      body = (
        <div className="space-y-3">
          <div>
            <label htmlFor="email-subject" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              Subject
            </label>
            <input
              id="email-subject"
              className={`${editorClass} font-medium`}
              value={outputs.email?.subject ?? ""}
              onChange={(e) => onUpdate({ ...outputs, email: { subject: e.target.value, body: outputs.email?.body ?? "" } })}
            />
          </div>
          <div>
            <label htmlFor="email-body" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              Body
            </label>
            <AutoTextarea
              id="email-body"
              className={editorClass}
              value={outputs.email?.body ?? ""}
              onChange={(e) => onUpdate({ ...outputs, email: { subject: outputs.email?.subject ?? "", body: e.target.value } })}
            />
          </div>
        </div>
      );
      break;
    case "headlines":
      body = (
        <ol className="space-y-2">
          {(outputs.headlines ?? []).map((h, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-sm font-semibold text-brand-600">{i + 1}</span>
              <input
                aria-label={`Headline ${i + 1}`}
                className={`${editorClass} font-serif text-base`}
                value={h}
                onChange={(e) =>
                  onUpdate({ ...outputs, headlines: outputs.headlines!.map((x, j) => (j === i ? e.target.value : x)) })
                }
              />
              <CopyButton text={h} label={`Copy headline ${i + 1}`} compact />
            </li>
          ))}
        </ol>
      );
      break;
    default:
      body = (
        <AutoTextarea
          aria-label={titleFor(k)}
          className={editorClass}
          value={outputs[k] ?? ""}
          onChange={(e) => onUpdate({ ...outputs, [k]: e.target.value })}
        />
      );
  }

  return (
    <OutputCard
      title={titleFor(k)}
      copyValue={text}
      regenerating={!!regenerating[k]}
      disabled={loading}
      error={cardErrors[k]}
      onRegenerate={() => onRegenerate(k)}
      headerExtra={
        k === "mls" && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ring-1 ${counterTone}`}>
            {mlsLength.toLocaleString()} / {limit.toLocaleString()}
          </span>
        )
      }
      footer={
        <div className="space-y-2">
          {k === "mls" && mlsLength > limit && (
            <p className="text-xs font-medium text-red-700">
              {(mlsLength - limit).toLocaleString()} characters over your MLS limit.
            </p>
          )}
          {k === "mls" && meta?.mlsAdjusted === "trimmed" && mlsLength <= limit && (
            <p className="text-xs text-muted">Trimmed to fit your limit. Give the last sentence a quick read.</p>
          )}
          <ComplianceChips flags={flags} onReplace={replace} />
        </div>
      }
    >
      {body}
    </OutputCard>
  );
}

function EmptyState({ onTrySample }: { onTrySample: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center sm:py-14">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        <HouseIcon width={22} height={22} />
      </div>
      <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">Your marketing copy will appear here</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        Fill in the property details and hit Generate. Each piece is editable, copy-ready, and checked for Fair
        Housing language.
      </p>
      <ul className="mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-2">
        {OUTPUT_TYPES.map((o) => (
          <li key={o.key} className="rounded-full border border-line bg-white px-3 py-1 text-xs text-muted">
            {o.label}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onTrySample}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
      >
        <SparkleIcon />
        Try it with a sample listing
      </button>
    </div>
  );
}
