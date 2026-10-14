"use client";

import { useRef, useState } from "react";
import {
  DEFAULT_MLS_CHAR_LIMIT,
  MAX_MLS_CHAR_LIMIT,
  MIN_MLS_CHAR_LIMIT,
  OUTPUT_KEYS,
  type OutputKey,
} from "@/lib/options";
import { outputToText } from "@/lib/outputText";
import { SAMPLE_LISTING } from "@/lib/sampleListing";
import type { GenerateRequest, GenerateResponse, GeneratedOutputs } from "@/lib/types";
import { ShieldCheckIcon } from "./Icons";
import ListingForm, { INITIAL_FORM, type FormErrors, type FormState } from "./ListingForm";
import OutputPanel, { type OutputMeta } from "./OutputPanel";

const SAMPLE_FORM: FormState = {
  listing: SAMPLE_LISTING,
  outputs: [...OUTPUT_KEYS],
  mlsCharLimit: String(DEFAULT_MLS_CHAR_LIMIT),
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.listing.city.trim()) errors.city = "Add the city or town. The copy needs a location.";
  if (form.outputs.length === 0) errors.outputs = "Pick at least one output to generate.";
  const limit = Number(form.mlsCharLimit);
  if (form.outputs.includes("mls") && !(limit >= MIN_MLS_CHAR_LIMIT && limit <= MAX_MLS_CHAR_LIMIT)) {
    errors.mlsCharLimit = `Set an MLS character limit between ${MIN_MLS_CHAR_LIMIT} and ${MAX_MLS_CHAR_LIMIT.toLocaleString()}.`;
  }
  return errors;
}

async function requestCopy(body: GenerateRequest): Promise<GenerateResponse> {
  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.outputs) {
    throw new Error(data?.error ?? `Something went wrong (error ${res.status}). Please try again.`);
  }
  return data as GenerateResponse;
}

export default function ListingLift() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const [outputs, setOutputs] = useState<GeneratedOutputs | null>(null);
  const [shownKeys, setShownKeys] = useState<OutputKey[]>([]);
  const [meta, setMeta] = useState<OutputMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<OutputKey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<Partial<Record<OutputKey, boolean>>>({});
  const [cardErrors, setCardErrors] = useState<Partial<Record<OutputKey, string>>>({});

  const outputsRef = useRef<HTMLDivElement>(null);

  const updateForm = (updater: (prev: FormState) => FormState) => {
    const next = updater(form);
    setForm(next);
    // Clear field errors as soon as the user fixes them.
    if (Object.keys(errors).length) setErrors(validateVisible(next, errors));
  };

  async function generate(f: FormState = form) {
    const found = validate(f);
    setErrors(found);
    if (Object.keys(found).length) {
      if (found.city) document.getElementById("city")?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    setCardErrors({});
    setPendingKeys(f.outputs);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => outputsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }

    const mlsCharLimit = Number(f.mlsCharLimit) || DEFAULT_MLS_CHAR_LIMIT;
    try {
      const data = await requestCopy({ listing: f.listing, outputs: f.outputs, mlsCharLimit });
      setOutputs(data.outputs);
      setShownKeys(f.outputs);
      setMeta({
        mock: data.meta.mock,
        model: data.meta.model,
        tone: f.listing.tone,
        mlsLimit: mlsCharLimit,
        mlsAdjusted: data.meta.mlsAdjusted,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function regenerate(key: OutputKey) {
    if (!outputs) return;
    if (!form.listing.city.trim()) {
      setErrors({ city: "Add the city or town. The copy needs a location." });
      document.getElementById("city")?.focus();
      return;
    }
    const formLimit = Number(form.mlsCharLimit);
    const mlsCharLimit =
      formLimit >= MIN_MLS_CHAR_LIMIT && formLimit <= MAX_MLS_CHAR_LIMIT
        ? formLimit
        : (meta?.mlsLimit ?? DEFAULT_MLS_CHAR_LIMIT);

    setRegenerating((r) => ({ ...r, [key]: true }));
    setCardErrors((e) => ({ ...e, [key]: undefined }));
    try {
      const data = await requestCopy({
        listing: form.listing,
        outputs: [key],
        mlsCharLimit,
        previous: { [key]: outputToText(key, outputs) },
      });
      setOutputs((prev) => ({ ...prev, [key]: data.outputs[key] }));
      if (key === "mls") {
        setMeta((m) => m && { ...m, mlsLimit: mlsCharLimit, mlsAdjusted: data.meta.mlsAdjusted });
      }
    } catch (err) {
      setCardErrors((e) => ({ ...e, [key]: err instanceof Error ? err.message : "Couldn't regenerate. Try again." }));
    } finally {
      setRegenerating((r) => ({ ...r, [key]: false }));
    }
  }

  const fillSample = () => {
    setForm(SAMPLE_FORM);
    setErrors({});
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" className="size-8" />
            <span className="font-serif text-xl font-semibold tracking-tight text-ink">ListingLift</span>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 sm:inline-flex">
            <ShieldCheckIcon width={14} height={14} />
            Fair Housing check built in
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-8 sm:px-6 lg:pt-10">
        <div className="mb-8 max-w-2xl">
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            Listing copy in seconds.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted sm:text-base">
            Enter the property once and get an MLS description, social post, email blast, headlines, and open house
            blurb. Everything is written from your facts only and checked for Fair Housing language.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8">
          <ListingForm
            form={form}
            errors={errors}
            loading={loading}
            onChange={updateForm}
            onSubmit={() => generate()}
            onFillSample={fillSample}
            onClear={() => {
              setForm(INITIAL_FORM);
              setErrors({});
            }}
          />

          <div
            ref={outputsRef}
            className="scroll-mt-4 lg:sticky lg:top-6 lg:-mx-2 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:px-2 lg:pb-2"
          >
            <OutputPanel
              outputs={outputs}
              shownKeys={shownKeys}
              meta={meta}
              loading={loading}
              pendingKeys={pendingKeys}
              error={error}
              regenerating={regenerating}
              cardErrors={cardErrors}
              onRetry={() => generate()}
              onTrySample={() => {
                fillSample();
                generate(SAMPLE_FORM);
              }}
              onRegenerate={regenerate}
              onUpdate={setOutputs}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
          <p>
            <strong className="font-semibold text-ink">Drafts only.</strong> ListingLift generates marketing drafts
            with AI. The listing agent is responsible for reviewing all copy for accuracy and for compliance with the
            Fair Housing Act, state and local fair housing laws, MLS rules, and brokerage advertising policies before
            publishing. The Fair Housing checker flags common problem phrases but is not legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Re-run validation but only keep errors that were already showing, so we don't nag mid-typing. */
function validateVisible(form: FormState, visible: FormErrors): FormErrors {
  const all = validate(form);
  const next: FormErrors = {};
  for (const key of Object.keys(visible) as (keyof FormErrors)[]) {
    if (all[key]) next[key] = all[key];
  }
  return next;
}
