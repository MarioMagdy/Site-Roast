// Chromium launcher: prefers a provisioned system browser (CHROME_PATH or cloud sandbox), else Playwright's own.
import fs from "node:fs";

export function chromePath() {
  return [process.env.CHROME_PATH, "/opt/pw-browsers/chromium"].filter(Boolean).find((p) => fs.existsSync(p)) ?? null;
}

export async function launchBrowser() {
  const { chromium } = await import("playwright");
  const executablePath = chromePath();
  return chromium.launch(executablePath ? { executablePath } : {});
}
