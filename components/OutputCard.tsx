"use client";

import { useEffect, useState, type ReactNode } from "react";
import { copyText } from "@/lib/outputText";
import { CheckIcon, CopyIcon, RefreshIcon } from "./Icons";

export function CopyButton({ text, label = "Copy", compact = false }: { text: string; label?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      disabled={!text.trim()}
      onClick={async () => setCopied(await copyText(text))}
      aria-label={compact ? `${label}${copied ? " (copied)" : ""}` : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 ${
        copied
          ? "border-brand-200 bg-brand-50 text-brand-700"
          : "border-line bg-white text-ink hover:border-stone-300 hover:bg-stone-50"
      } ${compact ? "p-2" : "px-3 py-1.5"}`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {!compact && <span aria-live="polite">{copied ? "Copied" : label}</span>}
    </button>
  );
}

type Props = {
  title: string;
  copyValue: string;
  regenerating: boolean;
  disabled: boolean;
  error?: string;
  onRegenerate: () => void;
  headerExtra?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export default function OutputCard({
  title,
  copyValue,
  regenerating,
  disabled,
  error,
  onRegenerate,
  headerExtra,
  footer,
  children,
}: Props) {
  return (
    <article className="rounded-2xl border border-line bg-white shadow-sm" aria-busy={regenerating}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
          {headerExtra}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={disabled || regenerating}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-stone-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshIcon className={regenerating ? "animate-spin" : ""} />
            {regenerating ? "Rewriting…" : "Regenerate"}
          </button>
          <CopyButton text={copyValue} />
        </div>
      </header>

      <div className="px-4 py-4 sm:px-5">
        {regenerating ? <SkeletonLines lines={5} /> : children}
        {error && !regenerating && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
      </div>

      {!regenerating && <footer className="border-t border-line bg-stone-50/60 px-4 py-3 sm:px-5 rounded-b-2xl">{footer}</footer>}
    </article>
  );
}

export function SkeletonLines({ lines }: { lines: number }) {
  return (
    <div className="space-y-2.5 py-1" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton h-3.5" style={{ width: i === lines - 1 ? "55%" : `${92 - (i % 3) * 7}%` }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white shadow-sm" aria-hidden>
      <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
        <span className="font-serif text-lg font-semibold text-stone-400">{title}</span>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-24" />
          <div className="skeleton h-8 w-20" />
        </div>
      </div>
      <div className="px-4 py-4 sm:px-5">
        <SkeletonLines lines={4} />
      </div>
    </div>
  );
}
