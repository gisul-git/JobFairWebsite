import { nanoid } from "nanoid";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import type { IUser } from "@/types";
import { buildCertificateHtml } from "./certificate-html";


function getFallbackLogoDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120" role="img" aria-label="GISUL logo">
    <rect width="400" height="120" fill="#ffffff"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#2D1B69">GISUL</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Sparticuz ships a Linux Chromium binary only. On Windows/macOS (and non-prod Linux dev)
 * use full `puppeteer`, which downloads/uses a local Chrome. On Linux production (Azure,
 * Vercel, etc.) use Sparticuz + `puppeteer-core` — no system Chrome required.
 *
 * If local launch fails with missing browser: `npx puppeteer browsers install chrome`
 * Override: FORCE_PUPPETEER_CHROME=1 to use full puppeteer on Linux (debugging).
 */
function shouldUseSparticuzChromium(): boolean {
  if (process.env.FORCE_PUPPETEER_CHROME === "1") return false;
  return process.env.NODE_ENV === "production" && process.platform === "linux";
}

/** GitHub release pack when `node_modules/@sparticuz/chromium/bin` is missing (common on slim deployments). */
function defaultChromiumPackTarUrl(version: string): string {
  const tag = `v${version}`;
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `https://github.com/Sparticuz/chromium/releases/download/${tag}/chromium-${tag}-pack.${arch}.tar`;
}

/** package.json is not an export of @sparticuz/chromium — resolve main and walk up to package root. */
function getSparticuzPackageInfo(req: NodeJS.Require): { root: string; version: string } | null {
  let dir = path.dirname(req.resolve("@sparticuz/chromium"));
  for (let i = 0; i < 12; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string; version?: string };
        if (pkg.name === "@sparticuz/chromium" && pkg.version) {
          return { root: dir, version: pkg.version };
        }
      } catch {
        // continue walking
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Resolves Sparticuz Chromium: local `bin` if present, else HTTPS pack URL (Sparticuz supports URL input).
 * Optional env: CHROMIUM_PACK_URL (e.g. self-hosted tar for air‑gapped).
 */
async function getSparticuzExecutablePath(
  chromium: typeof import("@sparticuz/chromium").default
): Promise<string> {
  const envUrl = process.env.CHROMIUM_PACK_URL?.trim();
  if (envUrl) {
    return chromium.executablePath(envUrl);
  }

  const req = createRequire(import.meta.url);
  const info = getSparticuzPackageInfo(req);
  if (!info) {
    return chromium.executablePath(defaultChromiumPackTarUrl("147.0.0"));
  }

  const binDir = path.join(info.root, "bin");
  if (existsSync(binDir)) {
    return chromium.executablePath();
  }

  return chromium.executablePath(defaultChromiumPackTarUrl(info.version));
}

async function getBrowser() {
  if (shouldUseSparticuzChromium()) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    const executablePath = await getSparticuzExecutablePath(chromium);
    return puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: (chromium as any).defaultViewport,
      executablePath,
      headless: true,
    });
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export async function generateCertificate(user: IUser & { certificateId?: string }): Promise<Buffer> {
  const certificateId =
    typeof user.certificateId === "string" && user.certificateId.trim().length > 0
      ? user.certificateId.trim()
      : nanoid(12);
  const downloadedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const logoPath = path.join(process.cwd(), "public", "gisul-logo.png");
  let logoSrc: string;
  try {
    const logoBuffer = await readFile(logoPath);
    logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    // Ensure PDF generation still works if logo asset is missing in runtime environment.
    logoSrc = getFallbackLogoDataUrl();
  }
  const html = buildCertificateHtml({
    name: user.name,
    downloadedDate,
    certificateId,
    logoSrc,
  });

  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    // Do not use networkidle0: Google Fonts in the template keep the network busy → 30s timeout.
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const pdf = await page.pdf({
      width: "1122px",
      height: "794px",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

