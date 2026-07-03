import fs from "node:fs";
import path from "node:path";

// Vendored copy of 03_AI_AGENCY_PLAYBOOK.md — kept inside the app directory
// so it deploys with the app rather than reaching outside the repo at
// runtime. Re-copy from the canonical doc if the Playbook changes.
let cached: string | null = null;

export function getPlaybook(): string {
  if (cached) return cached;
  cached = fs.readFileSync(
    path.join(process.cwd(), "content", "ai-agency-playbook.md"),
    "utf-8"
  );
  return cached;
}
