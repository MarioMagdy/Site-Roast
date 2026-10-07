// HTML file -> A4 PDF with page numbers.
import { launchBrowser } from "../browser.mjs";

export async function htmlToPdf(htmlPath, pdfPath) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto("file://" + htmlPath, { waitUntil: "load" });
    await page.pdf({
      path: pdfPath, format: "A4", printBackground: true, displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="font:8px Arial;color:#98a2b3;width:100%;text-align:center">Site Roast · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
    });
  } finally {
    await browser.close();
  }
}
