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
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    width: 1056px;
    height: 748px;
    background: #ffffff;
    font-family: 'Georgia', serif;
    position: relative;
    overflow: hidden;
  }

  .outer-border {
    position: absolute;
    inset: 0;
    border-top: 18px solid #6952a2;
    border-left: 18px solid #6952a2;
    border-bottom: 18px solid #f4e401;
    border-right: 18px solid #f4e401;
  }

  .inner-border {
    position: absolute;
    inset: 26px;
    border: 2px solid #6952a2;
    opacity: 0.4;
  }

  .corner-dots {
    position: absolute;
    width: 40px;
    height: 40px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    padding: 4px;
  }
  .corner-dots span {
    width: 5px;
    height: 5px;
    background: #f4e401;
    border-radius: 50%;
    display: block;
  }
  .dots-tl { top: 36px; left: 36px; }
  .dots-tr { top: 36px; right: 36px; }
  .dots-bl { bottom: 36px; left: 36px; }
  .dots-br { bottom: 36px; right: 36px; }

  .content {
    position: absolute;
    inset: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 80px;
  }

  .logo-row {
    width: 100%;
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .logo-img {
    height: 54px;
    width: auto;
    object-fit: contain;
  }

  .cert-title {
    font-family: 'Arial Black', sans-serif;
    font-size: 42px;
    font-weight: 900;
    letter-spacing: 0.18em;
    color: #1a1a2e;
    text-transform: uppercase;
    margin-top: 4px;
    margin-bottom: 2px;
  }

  .cert-subtitle {
    font-family: 'Arial', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: #f4e401;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .divider-line {
    width: 80px;
    height: 2px;
    background: #f4e401;
    margin: 0 auto 16px;
  }

  .presented-to {
    font-family: 'Arial', sans-serif;
    font-size: 11px;
    letter-spacing: 0.2em;
    color: #888;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .candidate-name {
    font-family: 'Georgia', serif;
    font-size: 52px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 8px;
    text-align: center;
  }

  .name-underline {
    width: 320px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #f4e401, transparent);
    margin: 0 auto 20px;
  }

  .completion-text {
    font-family: 'Arial', sans-serif;
    font-size: 13px;
    color: #555;
    text-align: center;
    margin-bottom: 4px;
    letter-spacing: 0.05em;
  }

  .course-name {
    font-family: 'Arial', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #6952a2;
    margin-bottom: 4px;
  }

  .cert-id {
    font-family: 'Arial', sans-serif;
    font-size: 10px;
    color: #aaa;
    letter-spacing: 0.1em;
    margin-bottom: 24px;
  }

  .footer-row {
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: auto;
    padding: 0 12px;
    gap: 24px;
  }

  .signatory {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .signature-text {
    font-family: 'Georgia', serif;
    font-size: 18px;
    font-style: italic;
    color: #1a1a2e;
    border-bottom: 1.5px solid #333;
    padding-bottom: 4px;
    min-width: 140px;
    text-align: center;
  }

  .signatory-name {
    font-family: 'Arial', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: 0.05em;
  }

  .signatory-title {
    font-family: 'Arial', sans-serif;
    font-size: 10px;
    color: #6952a2;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .badge-circle {
    width: 90px;
    height: 90px;
    background: #f4e401;
    border-radius: 50%;
    border: 4px solid #e6b800;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    position: relative;
  }

  .badge-stars {
    font-size: 14px;
    color: #1a1a2e;
    letter-spacing: 2px;
  }

  .badge-text-main {
    font-family: 'Arial Black', sans-serif;
    font-size: 9px;
    font-weight: 900;
    color: #1a1a2e;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    line-height: 1.2;
    text-align: center;
  }

  .badge-ribbon {
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 16px solid #e6b800;
    margin-top: -2px;
  }

  .date-downloaded {
    font-family: 'Arial', sans-serif;
    font-size: 10px;
    color: #aaa;
    margin-bottom: 6px;
    letter-spacing: 0.08em;
  }
</style>
</head>
<body>

  <div class="outer-border"></div>
  <div class="inner-border"></div>

  <div class="corner-dots dots-tl">
    ${Array(16).fill("<span></span>").join("")}
  </div>
  <div class="corner-dots dots-tr">
    ${Array(16).fill("<span></span>").join("")}
  </div>
  <div class="corner-dots dots-bl">
    ${Array(16).fill("<span></span>").join("")}
  </div>
  <div class="corner-dots dots-br">
    ${Array(16).fill("<span></span>").join("")}
  </div>

  <div class="content">
    
    <div class="logo-row">
      <img class="logo-img" src="${logoSrc}" alt="GISUL" />
    </div>

    <div class="cert-title">Certificate</div>
    <div class="cert-subtitle">of successful completion</div>
    <div class="divider-line"></div>

    <div class="presented-to">This certificate is proudly presented to</div>

    <div class="candidate-name">${userName}</div>
    <div class="name-underline"></div>

    <div class="completion-text">For Successful Completion Of Training On</div>
    <div class="course-name">AI Fundamentals &amp; Soft Skills for the Future</div>
    <div class="cert-id">Certificate ID: ${certificateId} &nbsp;|&nbsp; Downloaded: ${downloadedDate}</div>

    <div class="footer-row">
      <div class="signatory" style="align-items:flex-start;">
        <div class="date-downloaded">Generated on demand</div>
        <div class="signatory-title">GISUL Learning Program</div>
      </div>

      <div class="signatory">
        <div class="signature-text">Sahil Goyal</div>
        <div class="signatory-name">Sahil Goyal</div>
        <div class="signatory-title">CEO, GISUL</div>
      </div>

      <div class="badge">
        <div class="badge-circle">
          <div class="badge-stars">★ ★ ★</div>
          <div class="badge-text-main">Achievement<br/>Award</div>
        </div>
        <div class="badge-ribbon"></div>
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

export async function generateCertificate(user: IUser): Promise<Buffer> {
  const certificateId = nanoid(12);
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
      width: "1056px",
      height: "748px",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

