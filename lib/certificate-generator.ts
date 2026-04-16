import { nanoid } from "nanoid";

import type { IUser } from "@/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(d?: Date | string) {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

function buildCertificateHtml(input: { name: string; issueDate: string; certificateId: string }) {
  const { name, issueDate, certificateId } = input;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GISUL Certificate</title>
    <style>
      :root{
        --primary:#f4e401;
        --secondary:#6952a2;
        --cream:#f1dcba;
        --dark:#1a1a2e;
      }
      html,body{ height:100%; margin:0; }
      body{
        background: var(--dark);
        color: white;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      .wrap{ width:100%; padding:64px; box-sizing:border-box; }
      .card{
        border:2px solid rgba(241,220,186,0.35);
        border-radius:24px;
        padding:56px;
        position:relative;
        overflow:hidden;
        background:
          radial-gradient(1200px 600px at 20% 0%, rgba(105,82,162,0.25), transparent 60%),
          radial-gradient(900px 500px at 90% 20%, rgba(244,228,1,0.18), transparent 55%),
          rgba(255,255,255,0.03);
      }
      .brand{
        display:flex; align-items:center; gap:12px;
        font-weight:900; letter-spacing:0.12em;
        text-transform:uppercase;
      }
      .dot{ width:14px; height:14px; border-radius:999px; background:var(--primary); box-shadow:0 0 0 6px rgba(244,228,1,0.18); }
      h1{
        margin:32px 0 8px;
        font-size:52px;
        line-height:1.05;
        color: var(--primary);
      }
      .subtitle{
        margin:0;
        font-size:20px;
        color: rgba(255,255,255,0.82);
      }
      .name{
        margin:28px 0 14px;
        font-size:40px;
        font-weight:800;
        color: var(--cream);
      }
      .courses{
        margin-top:18px;
        padding:18px 22px;
        border-radius:16px;
        border:1px solid rgba(255,255,255,0.12);
        background: rgba(26,26,46,0.35);
      }
      .courses ul{ margin:10px 0 0; padding-left:18px; }
      .meta{
        display:flex;
        justify-content:space-between;
        gap:16px;
        margin-top:34px;
        font-size:14px;
        color: rgba(255,255,255,0.75);
      }
      .badge{
        padding:10px 12px;
        border-radius:999px;
        border:1px solid rgba(105,82,162,0.5);
        background: rgba(105,82,162,0.18);
        color: white;
        font-weight:700;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="brand"><span class="dot"></span> GISUL</div>
        <h1>Certificate of Completion</h1>
        <p class="subtitle">This certificate is proudly presented to</p>
        <div class="name">${escapeHtml(name)}</div>
        <div class="courses">
          <div style="font-weight:800; color: rgba(255,255,255,0.9)">Completed Courses</div>
          <ul>
            <li>AI Fundamentals</li>
            <li>Soft Skills for the Future</li>
          </ul>
        </div>
        <div class="meta">
          <div>
            <div style="font-weight:800; margin-bottom:6px; color: rgba(255,255,255,0.9)">Issue Date</div>
            <div>${escapeHtml(issueDate)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:800; margin-bottom:6px; color: rgba(255,255,255,0.9)">Certificate ID</div>
            <div class="badge">${escapeHtml(certificateId)}</div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
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
  const certificateId = (user as any).certificateId ?? nanoid(12);
  const issueDate = formatDate((user as any)?.certificate?.issuedAt);
  const html = buildCertificateHtml({
    name: user.name,
    issueDate,
    certificateId,
  });

  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      printBackground: true,
      format: "A4",
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

