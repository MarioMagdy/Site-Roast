// Chromium launcher: prefers a provisioned system browser (CHROME_PATH or cloud sandbox), else Playwright's own.
import fs from "node:fs";

export async function launchBrowser() {
  const { chromium } = await import("playwright");
  const executablePath = [process.env.CHROME_PATH, "/opt/pw-browsers/chromium"].filter(Boolean).find((p) => fs.existsSync(p));
  return chromium.launch(executablePath ? { executablePath } : {});
}
