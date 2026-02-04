import { chromium } from "playwright";
import type { StyleSignals } from "@webangle/style-analyzer";

const RENDER_TIMEOUT_MS = 15000;

export interface RenderedPage {
  html: string;
  text: string;
  styleSignals: StyleSignals;
  responsiveSignals: {
    hasViewportMeta: boolean;
    hasHorizontalOverflow: boolean;
  };
}

/**
 * Render a single URL with headless Chromium.
 * Use only when HTML shell is detected (SPA) so we get real DOM content.
 * Extracts computed CSS signals for style analysis (only when Playwright is used).
 */
export async function renderPage(url: string): Promise<RenderedPage> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: RENDER_TIMEOUT_MS,
    });

    const html = await page.content();
    const text = await page.innerText("body").catch(() => "");

    const styleSignals = await page.evaluate((): StyleSignals => {
      // Runs in browser: return plain object matching StyleSignals
      const fonts = new Set<string>();
      const colors = new Set<string>();

      document.querySelectorAll("*").forEach((el: Element) => {
        const cs = getComputedStyle(el);
        if (cs.fontFamily) fonts.add(cs.fontFamily);
        if (cs.color) colors.add(cs.color);
        if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
          colors.add(cs.backgroundColor);
        }
      });

      const body = document.body;
      const bodyStyle = body ? getComputedStyle(body) : ({} as CSSStyleDeclaration);

      let usesCssVariables = false;
      try {
        const sheets = document.styleSheets;
        for (let i = 0; i < sheets.length; i++) {
          try {
            const sheet = sheets[i];
            const rules = sheet.cssRules;
            for (let j = 0; j < rules.length; j++) {
              if (rules[j].cssText.includes("--")) {
                usesCssVariables = true;
                break;
              }
            }
          } catch {
            // cross-origin sheet
          }
        }
      } catch {
        // ignore
      }

      const baseFontSize = parseFloat(bodyStyle.fontSize || "16");
      const lineHeight = parseFloat(bodyStyle.lineHeight || "1.2");

      return {
        fontCount: fonts.size,
        colorCount: colors.size,
        baseFontSize: Number.isNaN(baseFontSize) ? 16 : baseFontSize,
        lineHeight: Number.isNaN(lineHeight) ? 1.2 : lineHeight,
        usesCssVariables,
        maxContentWidth: body?.scrollWidth ?? 0,
      };
    });

    const responsiveSignals = await page.evaluate(() => {
      const hasViewportMeta = !!document.querySelector('meta[name="viewport"]');
      const overflow = document.body.scrollWidth - window.innerWidth;
      return {
        hasViewportMeta,
        hasHorizontalOverflow: overflow > 20,
      };
    });

    return { html, text, styleSignals, responsiveSignals };
  } finally {
    await browser.close();
  }
}
