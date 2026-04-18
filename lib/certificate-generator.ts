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

  body {
    width: 1122px;
    height: 794px;
    background: #fff;
    font-family: 'Lato', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .cert {
    width: 1122px;
    height: 794px;
    position: relative;
    background: #fff;
    overflow: hidden;
  }

  /* ── Outer border frame ── */
  .border-outer {
    position: absolute;
    inset: 0;
    border: 14px solid #2D1B69;
    z-index: 2;
    pointer-events: none;
  }
  .border-inner {
    position: absolute;
    inset: 14px;
    border: 3px solid #F4E401;
    z-index: 2;
    pointer-events: none;
  }
  .border-accent {
    position: absolute;
    inset: 22px;
    border: 1px solid rgba(45,27,105,0.15);
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
    font-size: 180px;
    font-weight: 900;
    color: rgba(244,228,1,0.045);
    letter-spacing: 0.05em;
    transform: rotate(-25deg);
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
    width: 10px;
    height: 100%;
    background: linear-gradient(180deg, #F4E401 0%, #2D1B69 50%, #F4E401 100%);
    z-index: 3;
  }
  .right-stripe {
    position: absolute;
    right: 0;
    top: 0;
    width: 10px;
    height: 100%;
    background: linear-gradient(180deg, #F4E401 0%, #2D1B69 50%, #F4E401 100%);
    z-index: 3;
  }

  /* ── Main content ── */
  .content {
    position: absolute;
    inset: 30px 38px;
    z-index: 4;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* ── Header row ── */
  .header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-top: 10px;
    padding-bottom: 8px;
  }
  .logo-area {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .logo-img {
    height: 44px;
    width: auto;
    max-width: 220px;
    object-fit: contain;
  }
  .logo-sub {
    font-family: 'Lato', sans-serif;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.28em;
    color: #F4E401;
    background: #2D1B69;
    padding: 2px 6px;
    margin-top: 3px;
    text-transform: uppercase;
  }

  .header-dots {
    display: grid;
    grid-template-columns: repeat(5, 7px);
    gap: 4px;
    opacity: 0.6;
  }
  .header-dots span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #2D1B69;
    display: block;
  }
  .header-dots span:nth-child(n+6) { background: #F4E401; }

  /* ── Title block ── */
  .title-block {
    text-align: center;
    margin-top: 12px;
  }
  .title-label {
    font-family: 'Lato', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5em;
    color: #F4E401;
    text-transform: uppercase;
    background: #2D1B69;
    display: inline-block;
    padding: 4px 18px;
    margin-bottom: 10px;
  }
  .title-main {
    font-family: 'Cinzel', serif;
    font-size: 58px;
    font-weight: 900;
    color: #2D1B69;
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
  }
  .title-sub {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0.5em;
    color: #5B4FCF;
    margin-top: 4px;
    text-transform: uppercase;
  }

  /* ── Decorative rule ── */
  .rule {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 12px 0 10px;
    width: 480px;
  }
  .rule-line { flex: 1; height: 1px; background: #2D1B69; opacity: 0.25; }
  .rule-diamond {
    width: 8px;
    height: 8px;
    background: #F4E401;
    transform: rotate(45deg);
    border: 1px solid #2D1B69;
    flex-shrink: 0;
  }

  /* ── Presenter text ── */
  .presented-to {
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.38em;
    color: #888;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  /* ── Recipient name ── */
  .recipient {
    font-family: 'Cormorant Garamond', serif;
    font-size: 72px;
    font-weight: 700;
    font-style: italic;
    color: #2D1B69;
    letter-spacing: 0.02em;
    line-height: 1;
    text-align: center;
  }

  /* ── Course info ── */
  .course-wrap {
    margin-top: 10px;
    text-align: center;
  }
  .course-intro {
    font-family: 'Lato', sans-serif;
    font-size: 10.5px;
    letter-spacing: 0.12em;
    color: #666;
    text-transform: uppercase;
    font-weight: 400;
  }
  .course-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 700;
    color: #2D1B69;
    letter-spacing: 0.06em;
    margin-top: 2px;
  }
  .course-name span { color: #5B4FCF; }

  /* ── Footer row ── */
  .footer {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: auto;
    padding-bottom: 10px;
    padding-left: 30px;
    padding-right: 30px;
  }

  /* Left meta */
  .meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .meta-row {
    font-family: 'Lato', sans-serif;
    font-size: 8.5px;
    letter-spacing: 0.15em;
    color: #888;
    text-transform: uppercase;
  }
  .meta-row strong {
    color: #2D1B69;
    font-weight: 700;
  }
  .meta-program {
    font-family: 'Cinzel', serif;
    font-size: 8px;
    font-weight: 600;
    color: #5B4FCF;
    letter-spacing: 0.3em;
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
    font-size: 30px;
    font-style: italic;
    color: #2D1B69;
    line-height: 1;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .sig-line {
    width: 160px;
    height: 1px;
    background: #2D1B69;
    margin: 0 auto 5px;
    opacity: 0.4;
  }
  .sig-name {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 700;
    color: #2D1B69;
    letter-spacing: 0.1em;
  }
  .sig-title {
    font-family: 'Lato', sans-serif;
    font-size: 9px;
    letter-spacing: 0.2em;
    color: #5B4FCF;
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* Seal badge */
  .seal {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  .seal-circle {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 38%, #F4E401, #d4c000);
    border: 3px solid #2D1B69;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(244,228,1,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
    position: relative;
  }
  .seal-circle::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    border: 1px dashed rgba(45,27,105,0.5);
  }
  .seal-stars { font-size: 10px; letter-spacing: 2px; color: #2D1B69; }
  .seal-text {
    font-family: 'Cinzel', serif;
    font-size: 7.5px;
    font-weight: 700;
    color: #2D1B69;
    text-align: center;
    letter-spacing: 0.08em;
    line-height: 1.3;
    text-transform: uppercase;
    padding: 0 6px;
    margin-top: 4px;
  }
  .seal-pin {
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 14px solid #2D1B69;
    margin-top: -1px;
  }
  .seal-pin-inner {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 10px solid #d4c000;
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
      <div class="header-dots">
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span>
      </div>
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
        <div class="meta-program">GISUL · Global Institute of Skills &amp; Upskilling in Learning</div>
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
        <div style="position:relative;width:18px;height:14px;margin-top:0;">
          <div style="position:absolute;left:0;top:0;width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:14px solid #2D1B69;"></div>
          <div style="position:absolute;left:3px;top:0;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #d4c000;"></div>
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

async function getBrowser() {
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: (chromium as any).defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.default.launch({ headless: true });
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
  const logoBuffer = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
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

