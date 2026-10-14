import type { OutputKey } from "./options";
import type { GeneratedOutputs } from "./types";

/** Plain-text version of one output: what Copy puts on the clipboard and what the checker scans. */
export function outputToText(key: OutputKey, outputs: GeneratedOutputs): string {
  switch (key) {
    case "email":
      return outputs.email ? `Subject: ${outputs.email.subject}\n\n${outputs.email.body}` : "";
    case "headlines":
      return outputs.headlines?.join("\n") ?? "";
    default:
      return outputs[key] ?? "";
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API needs a secure context (e.g. fails when testing on a phone over LAN http).
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}
