import { nanoid } from "nanoid";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { IUser } from "@/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildCertificateHtml(input: { name: string; downloadedDate: string; certificateId: string; logoSrc: string }) {
  const userName = escapeHtml(input.name);
  const certificateId = escapeHtml(input.certificateId);
  const downloadedDate = escapeHtml(input.downloadedDate);
  const logoSrc = input.logoSrc;

  const certificateHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>GISUL Certificate</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@400;600;700;900&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: 1122px 794px;
    margin: 0;
  }

  html, body {
    width: 1122px;
    height: 794px;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  body {
    width: 1122px;
    height: 794px;
    background: radial-gradient(circle at top, #f3f2fb 0%, #eceaf4 45%, #fdfdfd 100%);
    font-family: 'Lato', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cert {
    width: 1122px;
    height: 794px;
    position: relative;
    background: #ffffff;
    overflow: hidden;
    box-shadow: 0 18px 50px rgba(20, 15, 70, 0.12);
  }

  /* ── Outer border frame ── */
  .border-outer {
    position: absolute;
    inset: 0;
    border: 10px solid #2D1B69;
    box-shadow: inset 0 0 0 4px rgba(244,228,1,0.22), 0 18px 40px rgba(20,15,70,0.08);
    z-index: 2;
    pointer-events: none;
  }
  .border-inner {
    position: absolute;
    inset: 16px;
    border: 2px solid rgba(244,228,1,0.9);
    box-shadow: inset 0 0 0 1px rgba(45,27,105,0.14);
    z-index: 2;
    pointer-events: none;
  }
  .border-accent {
    position: absolute;
    inset: 26px;
    border: 1px dotted rgba(45,27,105,0.16);
    z-index: 2;
    pointer-events: none;
  }

  /* ── Background watermark ── */
  .watermark {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
  }
  .watermark-text {
    font-family: 'Cinzel', serif;
    font-size: 240px;
    font-weight: 900;
    color: rgba(45, 27, 105, 0.05);
    letter-spacing: 0.08em;
    transform: rotate(-20deg);
    white-space: nowrap;
    user-select: none;
  }

  /* ── Corner ornaments ── */
  .corner {
    position: absolute;
    width: 80px;
    height: 80px;
    z-index: 3;
  }
  .corner svg { width: 100%; height: 100%; }
  .corner-tl { top: 28px; left: 28px; }
  .corner-tr { top: 28px; right: 28px; transform: scaleX(-1); }
  .corner-bl { bottom: 28px; left: 28px; transform: scaleY(-1); }
  .corner-br { bottom: 28px; right: 28px; transform: scale(-1); }

  /* ── Left decorative stripe ── */
  .left-stripe {
    position: absolute;
    left: 0;
    top: 0;
    width: 6px;
    height: 100%;
    background: linear-gradient(180deg, #F4E401 0%, #2D1B69 50%, #F4E401 100%);
    z-index: 3;
    opacity: 0.95;
  }
  .right-stripe {
    position: absolute;
    right: 0;
    top: 0;
    width: 6px;
    height: 100%;
    background: linear-gradient(180deg, #F4E401 0%, #2D1B69 50%, #F4E401 100%);
    z-index: 3;
    opacity: 0.95;
  }

  /* ── Main content ── */
  .content {
    position: absolute;
    inset: 24px 46px 40px;
    z-index: 4;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 980px;
    margin: 0 auto;
  }

  /* ── Header row ── */
  .header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 22px;
    padding-bottom: 14px;
  }
  .logo-area {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .logo-img {
    height: 68px;
    width: auto;
    max-width: 220px;
    object-fit: contain;
  }
  .logo-sub {
    font-family: 'Lato', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.24em;
    color: #F4E401;
    background: #2D1B69;
    padding: 4px 12px;
    text-transform: uppercase;
  }

  .header-tagline {
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    letter-spacing: 0.35em;
    color: #5B4FCF;
    text-transform: uppercase;
    opacity: 0.9;
    max-width: 260px;
    text-align: right;
    line-height: 1.3;
  }

  /* ── Title block ── */
  .title-block {
    text-align: center;
    margin-top: 24px;
  }
  .title-label {
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.45em;
    color: #F4E401;
    text-transform: uppercase;
    background: #2D1B69;
    display: inline-block;
    padding: 6px 22px;
    margin-bottom: 16px;
  }
  .title-main {
    font-family: 'Cinzel', serif;
    font-size: 98px;
    font-weight: 900;
    color: #2D1B69;
    letter-spacing: 0.12em;
    line-height: 0.94;
    text-transform: uppercase;
  }
  .title-sub {
    font-family: 'Cinzel', serif;
    font-size: 18px;
    font-weight: 400;
    letter-spacing: 0.6em;
    color: #5B4FCF;
    margin-top: 12px;
    text-transform: uppercase;
  }

  /* ── Decorative rule ── */
  .rule {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 18px 0 14px;
    width: 560px;
  }
  .rule-line { flex: 1; height: 1px; background: #2D1B69; opacity: 0.22; }
  .rule-diamond {
    width: 10px;
    height: 10px;
    background: #F4E401;
    transform: rotate(45deg);
    border: 1px solid #2D1B69;
    flex-shrink: 0;
  }

  /* ── Presenter text ── */
  .presented-to {
    font-family: 'Lato', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.34em;
    color: #7a7a7a;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  /* ── Recipient name ── */
  .recipient {
    font-family: 'Cormorant Garamond', serif;
    font-size: 108px;
    font-weight: 700;
    font-style: italic;
    color: #2D1B69;
    letter-spacing: 0.01em;
    line-height: 0.96;
    text-align: center;
    margin-bottom: 18px;
  }

  /* ── Course info ── */
  .course-wrap {
    margin-top: 18px;
    text-align: center;
  }
  .course-intro {
    font-family: 'Lato', sans-serif;
    font-size: 12px;
    letter-spacing: 0.18em;
    color: #5d5d84;
    text-transform: uppercase;
    font-weight: 500;
  }
  .course-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px;
    font-weight: 700;
    color: #2D1B69;
    letter-spacing: 0.04em;
    margin-top: 10px;
    line-height: 1.25;
  }
  .course-name span { color: #5B4FCF; }

  /* ── Footer row ── */
  .footer {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: auto;
    padding: 0 30px 28px;
    gap: 24px;
  }

  /* Left meta */
  .meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-left: 30px;
  }
  .meta-row {
    font-family: 'Lato', sans-serif;
    font-size: 9px;
    letter-spacing: 0.16em;
    color: #777;
    text-transform: uppercase;
  }
  .meta-row strong {
    color: #2D1B69;
    font-weight: 700;
  }
  .meta-program {
    font-family: 'Cinzel', serif;
    font-size: 8.5px;
    font-weight: 600;
    color: #5B4FCF;
    letter-spacing: 0.25em;
    margin-top: 6px;
    text-transform: uppercase;
  }

  /* Signature */
  .sig {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .sig-script {
    font-family: 'Cormorant Garamond', serif;
    font-size: 34px;
    font-style: italic;
    color: #2D1B69;
    line-height: 1;
    margin-bottom: 6px;
    font-weight: 600;
  }
  .sig-line {
    width: 180px;
    height: 1px;
    background: #2D1B69;
    margin: 0 auto 6px;
    opacity: 0.4;
  }
  .sig-name {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    font-weight: 700;
    color: #2D1B69;
    letter-spacing: 0.1em;
  }
  .sig-title {
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    letter-spacing: 0.22em;
    color: #5B4FCF;
    text-transform: uppercase;
    margin-top: 4px;
  }

  /* Seal badge */
  .seal {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    margin-right: 30px;
  }
  .seal-circle {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #fff9b2 0%, #f4e401 35%, #d4c000 100%);
    border: 4px solid #2D1B69;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(20,15,70,0.12), inset 0 1px 0 rgba(255,255,255,0.4);
    position: relative;
  }
  .seal-circle::before {
    content: '';
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    border: 1px solid rgba(45,27,105,0.18);
  }
  .seal-circle::after {
    content: '';
    position: absolute;
    inset: 22px;
    border-radius: 50%;
    border: 1px dashed rgba(45,27,105,0.22);
  }
  .seal-stars {
    font-size: 12px;
    letter-spacing: 3px;
    color: #2D1B69;
    margin-bottom: 4px;
  }
  .seal-text {
    font-family: 'Cinzel', serif;
    font-size: 9px;
    font-weight: 700;
    color: #2D1B69;
    text-align: center;
    letter-spacing: 0.08em;
    line-height: 1.3;
    text-transform: uppercase;
    padding: 0 8px;
    margin-top: 2px;
  }
  .seal-pin {
    position: relative;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 16px solid #2D1B69;
    margin-top: -4px;
  }
  .seal-pin-inner {
    position: absolute;
    top: 1px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 12px solid #d4c000;
  }
</style>
</head>
<body>
<div class="cert">

  <div class="left-stripe"></div>
  <div class="right-stripe"></div>

  <!-- Background watermark -->
  <div class="watermark">
    <div class="watermark-text">GISUL</div>
  </div>

  <!-- Border frames -->
  <div class="border-outer"></div>
  <div class="border-inner"></div>
  <div class="border-accent"></div>

  <!-- Corner ornaments -->
  <div class="corner corner-tl">
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4 L34 4 L34 8 L8 8 L8 34 L4 34 Z" fill="#2D1B69"/>
      <path d="M10 10 L28 10 L28 13 L13 13 L13 28 L10 28 Z" fill="#F4E401"/>
      <rect x="16" y="16" width="6" height="6" fill="#2D1B69" transform="rotate(45 19 19)"/>
    </svg>
  </div>
  <div class="corner corner-tr">
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4 L34 4 L34 8 L8 8 L8 34 L4 34 Z" fill="#2D1B69"/>
      <path d="M10 10 L28 10 L28 13 L13 13 L13 28 L10 28 Z" fill="#F4E401"/>
      <rect x="16" y="16" width="6" height="6" fill="#2D1B69" transform="rotate(45 19 19)"/>
    </svg>
  </div>
  <div class="corner corner-bl">
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4 L34 4 L34 8 L8 8 L8 34 L4 34 Z" fill="#2D1B69"/>
      <path d="M10 10 L28 10 L28 13 L13 13 L13 28 L10 28 Z" fill="#F4E401"/>
      <rect x="16" y="16" width="6" height="6" fill="#2D1B69" transform="rotate(45 19 19)"/>
    </svg>
  </div>
  <div class="corner corner-br">
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4 L34 4 L34 8 L8 8 L8 34 L4 34 Z" fill="#2D1B69"/>
      <path d="M10 10 L28 10 L28 13 L13 13 L13 28 L10 28 Z" fill="#F4E401"/>
      <rect x="16" y="16" width="6" height="6" fill="#2D1B69" transform="rotate(45 19 19)"/>
    </svg>
  </div>

  <!-- Content -->
  <div class="content">

    <!-- Header -->
    <div class="header">
      <div class="logo-area">
        <img class="logo-img" src="${logoSrc}" alt="GISUL" />
        <div class="logo-sub">Learning Program</div>
      </div>
      <div class="header-tagline">Connecting Minds, Elevating Skills</div>
    </div>

    <!-- Title -->
    <div class="title-block">
      <div class="title-label">Award of Excellence</div>
      <div class="title-main">Certificate</div>
      <div class="title-sub">of Successful Completion</div>
    </div>

    <!-- Divider -->
    <div class="rule">
      <div class="rule-line"></div>
      <div class="rule-diamond"></div>
      <div class="rule-line"></div>
      <div class="rule-diamond"></div>
      <div class="rule-line"></div>
    </div>

    <!-- Presented to -->
    <div class="presented-to">This Certificate is Proudly Presented To</div>

    <div class="recipient">${userName}</div>

    <!-- Course info -->
    <div class="course-wrap">
      <div class="course-intro">For Successful Completion of Training On</div>
      <div class="course-name"><span>AI Fundamentals</span> &amp; <span>Soft Skills for the Future</span></div>
    </div>

    <!-- Footer -->
    <div class="footer">

      <div class="meta">
        <div class="meta-row">Issue Date: <strong>${downloadedDate}</strong></div>
        <div class="meta-row">Certificate ID: <strong style="font-family:monospace;letter-spacing:0.08em;">${certificateId}</strong></div>
        <div class="meta-program">GISUL · Connecting Minds, Elevating Skills</div>
      </div>

      <div class="sig">
        <div class="sig-script">Sahil Goyal</div>
        <div class="sig-line"></div>
        <div class="sig-name">Sahil Goyal</div>
        <div class="sig-title">Chief Executive Officer · GISUL</div>
      </div>

      <div class="seal">
        <div class="seal-circle">
          <div class="seal-stars">★ ★ ★</div>
          <div class="seal-text">Achievement<br>Award</div>
        </div>
        <div class="seal-pin">
          <div class="seal-pin-inner"></div>
        </div>
      </div>

    </div>
  </div>

</div>
</body>
</html>
`;

  return certificateHTML;
}

function getFallbackLogoDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120" role="img" aria-label="GISUL logo">
    <rect width="400" height="120" fill="#ffffff"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#2D1B69">GISUL</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function getBrowser() {
  try {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: (chromium as any).defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } catch {
    // Fallback for local/dev environments where full puppeteer can manage browser binary.
    const puppeteer = await import("puppeteer");
    return puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
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
    await page.setContent(html, { waitUntil: "networkidle0" });
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

