"use client";

import type { ReactNode } from "react";
import {
  DEFAULT_MLS_CHAR_LIMIT,
  FEATURE_OPTIONS,
  MAX_MLS_CHAR_LIMIT,
  MIN_MLS_CHAR_LIMIT,
  OUTPUT_KEYS,
  OUTPUT_TYPES,
  PROPERTY_TYPES,
  TONES,
  type OutputKey,
} from "@/lib/options";
import type { Listing } from "@/lib/types";
import { CheckIcon, SparkleIcon, WandIcon } from "./Icons";

export type FormState = {
  listing: Listing;
  outputs: OutputKey[];
  /** Kept as a string while editing; validated on submit. */
  mlsCharLimit: string;
};

export type FormErrors = Partial<Record<"city" | "outputs" | "mlsCharLimit", string>>;

export const EMPTY_LISTING: Listing = {
  address: "",
  city: "",
  propertyType: "single-family",
  price: "",
  beds: "",
  baths: "",
  sqft: "",
  lotSize: "",
  yearBuilt: "",
  features: [],
  otherFeatures: "",
  locationHighlights: "",
  agentNotes: "",
  tone: "warm",
};

export const INITIAL_FORM: FormState = {
  listing: EMPTY_LISTING,
  outputs: [...OUTPUT_KEYS],
  mlsCharLimit: String(DEFAULT_MLS_CHAR_LIMIT),
};

const inputClass =
  "block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] text-ink shadow-xs placeholder:text-stone-400 transition-colors hover:border-stone-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

const digitsOnly = (v: string) => v.replace(/\D/g, "");
const withCommas = (v: string) => (v ? Number(v).toLocaleString("en-US") : "");

function Section({ step, title, hint, children }: { step: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-6 first:border-t-0 sm:px-6">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
          {step}
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-muted">Optional</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

type Props = {
  form: FormState;
  errors: FormErrors;
  loading: boolean;
  onChange: (updater: (prev: FormState) => FormState) => void;
  onSubmit: () => void;
  onFillSample: () => void;
  onClear: () => void;
};

export default function ListingForm({ form, errors, loading, onChange, onSubmit, onFillSample, onClear }: Props) {
  const l = form.listing;
  const isLand = l.propertyType === "land";

  const setListing = <K extends keyof Listing>(key: K, value: Listing[K]) =>
    onChange((prev) => ({ ...prev, listing: { ...prev.listing, [key]: value } }));

  const toggleFeature = (feature: string) =>
    onChange((prev) => {
      const has = prev.listing.features.includes(feature);
      const features = has
        ? prev.listing.features.filter((f) => f !== feature)
        : [...prev.listing.features, feature];
      return { ...prev, listing: { ...prev.listing, features } };
    });

  const toggleOutput = (key: OutputKey) =>
    onChange((prev) => {
      const has = prev.outputs.includes(key);
      // Keep the canonical order so cards always render in the same sequence.
      const outputs = OUTPUT_KEYS.filter((k) => (k === key ? !has : prev.outputs.includes(k)));
      return { ...prev, outputs };
    });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-2xl border border-line bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">Property details</h2>
          <p className="text-sm text-muted">Only what you enter here ends up in the copy.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-stone-100 hover:text-ink"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onFillSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100"
          >
            <WandIcon />
            Fill sample listing
          </button>
        </div>
      </div>

      <Section step={1} title="Basics">
        <Field
          label="Street address"
          htmlFor="address"
          optional
          hint="Leave blank to keep the address out of drafts. The copy will use the town instead."
        >
          <input
            id="address"
            className={inputClass}
            value={l.address}
            onChange={(e) => setListing("address", e.target.value)}
            placeholder="214 Hawthorne Lane"
            autoComplete="off"
            maxLength={200}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City / town" htmlFor="city" error={errors.city}>
            <input
              id="city"
              className={`${inputClass} ${errors.city ? "border-red-400" : ""}`}
              value={l.city}
              onChange={(e) => setListing("city", e.target.value)}
              placeholder="Malvern, PA"
              aria-invalid={!!errors.city}
              maxLength={100}
            />
          </Field>
          <Field label="Property type" htmlFor="propertyType">
            <div className="relative">
              <select
                id="propertyType"
                className={`${inputClass} appearance-none pr-9`}
                value={l.propertyType}
                onChange={(e) => setListing("propertyType", e.target.value as Listing["propertyType"])}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              >
                <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
              </svg>
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="List price" htmlFor="price" className="col-span-2 sm:col-span-1">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[15px] text-muted">$</span>
              <input
                id="price"
                className={`${inputClass} pl-7`}
                inputMode="numeric"
                value={withCommas(l.price)}
                onChange={(e) => setListing("price", digitsOnly(e.target.value).slice(0, 12))}
                placeholder="749,900"
              />
            </div>
          </Field>
          {!isLand && (
            <>
              <Field label="Beds" htmlFor="beds">
                <input
                  id="beds"
                  className={inputClass}
                  type="number"
                  min={0}
                  max={99}
                  inputMode="numeric"
                  value={l.beds}
                  onChange={(e) => setListing("beds", e.target.value.slice(0, 3))}
                  placeholder="4"
                />
              </Field>
              <Field label="Baths" htmlFor="baths">
                <input
                  id="baths"
                  className={inputClass}
                  type="number"
                  min={0}
                  max={99}
                  step={0.5}
                  inputMode="decimal"
                  value={l.baths}
                  onChange={(e) => setListing("baths", e.target.value.slice(0, 5))}
                  placeholder="2.5"
                />
              </Field>
              <Field label="Sq ft" htmlFor="sqft">
                <input
                  id="sqft"
                  className={inputClass}
                  inputMode="numeric"
                  value={withCommas(l.sqft)}
                  onChange={(e) => setListing("sqft", digitsOnly(e.target.value).slice(0, 7))}
                  placeholder="2,640"
                />
              </Field>
            </>
          )}
          <Field label="Lot size" htmlFor="lotSize">
            <input
              id="lotSize"
              className={inputClass}
              value={l.lotSize}
              onChange={(e) => setListing("lotSize", e.target.value)}
              placeholder="0.52 acres"
              maxLength={60}
            />
          </Field>
          {!isLand && (
            <Field label="Year built" htmlFor="yearBuilt">
              <input
                id="yearBuilt"
                className={inputClass}
                inputMode="numeric"
                value={l.yearBuilt}
                onChange={(e) => setListing("yearBuilt", digitsOnly(e.target.value).slice(0, 4))}
                placeholder="1994"
              />
            </Field>
          )}
        </div>
      </Section>

      <Section step={2} title="Features" hint="Tap everything that applies.">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Features">
          {FEATURE_OPTIONS.map((feature) => {
            const on = l.features.includes(feature);
            return (
              <button
                key={feature}
                type="button"
                aria-pressed={on}
                onClick={() => toggleFeature(feature)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
                    : "border-line bg-white text-ink hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                {on && <CheckIcon width={14} height={14} />}
                {feature}
              </button>
            );
          })}
        </div>
        <Field label="Other features" htmlFor="otherFeatures" optional>
          <textarea
            id="otherFeatures"
            rows={2}
            className={`${inputClass} resize-y`}
            value={l.otherFeatures}
            onChange={(e) => setListing("otherFeatures", e.target.value)}
            placeholder="Quartz counters, 2-car attached garage, gas fireplace…"
            maxLength={1500}
          />
        </Field>
      </Section>

      <Section step={3} title="Location highlights">
        <Field label="What's nearby" htmlFor="locationHighlights" optional>
          <textarea
            id="locationHighlights"
            rows={2}
            className={`${inputClass} resize-y`}
            value={l.locationHighlights}
            onChange={(e) => setListing("locationHighlights", e.target.value)}
            placeholder="Walk to downtown, near parks, easy commute to Route 202"
            maxLength={1500}
          />
        </Field>
      </Section>

      <Section step={4} title="Agent notes" hint="Paste your rough notes. Shorthand and typos are fine.">
        <Field
          label="Notes"
          htmlFor="agentNotes"
          optional
          hint="Private details like seller motivation, lockbox info, and showing instructions are kept out of the copy."
        >
          <textarea
            id="agentNotes"
            rows={5}
            className={`${inputClass} resize-y`}
            value={l.agentNotes}
            onChange={(e) => setListing("agentNotes", e.target.value)}
            placeholder={"kitchen redone 2021, quartz + SS\nroof 2022\nflat backyard backs to trees"}
            maxLength={5000}
          />
        </Field>
      </Section>

      <Section step={5} title="Tone">
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tone">
          {TONES.map((t) => {
            const on = l.tone === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setListing("tone", t.value)}
                className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  on
                    ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                    : "border-line bg-white hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                <span className={`block text-sm font-semibold ${on ? "text-brand-800" : "text-ink"}`}>{t.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t.hint}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section step={6} title="Outputs to generate">
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {OUTPUT_TYPES.map((o) => {
            const on = form.outputs.includes(o.key);
            return (
              <div key={o.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleOutput(o.key)}
                    className="mt-0.5 size-4 shrink-0 accent-brand-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{o.label}</span>
                    <span className="block text-xs text-muted">{o.hint}</span>
                  </span>
                </label>
                {o.key === "mls" && (
                  <div className="ml-7 flex items-center gap-2 sm:ml-0">
                    <label htmlFor="mlsCharLimit" className="text-xs text-muted">
                      Char limit
                    </label>
                    <input
                      id="mlsCharLimit"
                      inputMode="numeric"
                      disabled={!on}
                      value={form.mlsCharLimit}
                      onChange={(e) =>
                        onChange((prev) => ({ ...prev, mlsCharLimit: digitsOnly(e.target.value).slice(0, 4) }))
                      }
                      aria-invalid={!!errors.mlsCharLimit}
                      className={`w-20 rounded-md border px-2 py-1 text-sm tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 ${
                        errors.mlsCharLimit ? "border-red-400" : "border-line"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {(errors.outputs || errors.mlsCharLimit) && (
          <p className="text-sm text-red-700" role="alert">
            {errors.outputs ?? errors.mlsCharLimit}
          </p>
        )}
        <p className="text-xs text-muted">
          MLS limit must be between {MIN_MLS_CHAR_LIMIT.toLocaleString()} and {MAX_MLS_CHAR_LIMIT.toLocaleString()} characters.
        </p>
      </Section>

      <div className="sticky bottom-0 z-10 rounded-b-2xl border-t border-line bg-white/90 px-5 py-4 backdrop-blur sm:px-6">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-brand-400"
        >
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
              Writing your copy…
            </>
          ) : (
            <>
              <SparkleIcon />
              Generate copy
            </>
          )}
        </button>
      </div>
    </form>
  );
}
