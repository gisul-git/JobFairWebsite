import { buildCertificateHtml } from "@/lib/certificate-html";

const CERT_W = 1122;
const CERT_H = 794;

function fallbackLogoDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120" role="img" aria-label="GISUL logo">
    <rect width="400" height="120" fill="#ffffff"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#2D1B69">GISUL</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export async function fetchLogoDataUrl(): Promise<string> {
  try {
    const res = await fetch(`${window.location.origin}/gisul-logo.png`, { cache: "force-cache" });
    if (!res.ok) return fallbackLogoDataUrl();
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return fallbackLogoDataUrl();
  }
}

export type ClientCertificatePdfInput = {
  name: string;
  certificateId: string;
  downloadedDate?: string;
  logoSrc?: string;
};

async function captureCertificateCanvas(input: ClientCertificatePdfInput): Promise<HTMLCanvasElement> {
  const downloadedDate =
    input.downloadedDate ??
    new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const logoSrc = input.logoSrc ?? (await fetchLogoDataUrl());

  const html = buildCertificateHtml({
    name: input.name,
    certificateId: input.certificateId,
    downloadedDate,
    logoSrc,
  });

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = `position:fixed;left:-12000px;top:0;width:${CERT_W}px;height:${CERT_H}px;border:0;margin:0;padding:0;`;
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error("Certificate iframe not available");
  }

  doc.open();
  doc.write(html);
  doc.close();

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    window.setTimeout(() => resolve(), 900);
  });

  try {
    if (iframe.contentWindow?.document.fonts) {
      await iframe.contentWindow.document.fonts.ready.catch(() => undefined);
    }
  } catch {
    // ignore
  }
  await new Promise((r) => window.setTimeout(r, 500));

  const root = doc.querySelector(".cert") as HTMLElement | null;
  if (!root) {
    iframe.remove();
    throw new Error("Certificate markup missing");
  }

  const { default: html2canvas } = await import("html2canvas");

  const canvas = await html2canvas(root, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: CERT_W,
    height: CERT_H,
    windowWidth: CERT_W,
    windowHeight: CERT_H,
    backgroundColor: "#ffffff",
  });

  iframe.remove();
  return canvas;
}

/**
 * Renders the certificate HTML to a PDF Blob in the browser (no Puppeteer / Chromium).
 */
export async function renderCertificatePdfBlob(input: ClientCertificatePdfInput): Promise<Blob> {
  const canvas = await captureCertificateCanvas(input);

  const { default: jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [CERT_W, CERT_H],
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(imgData, "JPEG", 0, 0, CERT_W, CERT_H, undefined, "FAST");

  return pdf.output("blob");
}

/** PNG snapshot of the certificate (for LinkedIn Open Graph upload). */
export async function renderCertificatePngBlob(input: ClientCertificatePdfInput): Promise<Blob> {
  const canvas = await captureCertificateCanvas(input);
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Could not encode certificate image"));
      },
      "image/png",
      0.95
    );
  });
}

export function certificatePngToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function postCertificateRecordOnly(userId: string, certificateId: string): Promise<{
  certificateId: string;
  blobUrl?: string;
  points?: number;
  funnel?: Partial<{ currentStep: number; completedSteps: number[] }>;
}> {
  const res = await fetch("/api/certificate/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId, recordOnly: true, certificateId }),
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? "Unable to save certificate");
  }
  return {
    certificateId: String(json.data?.certificateId ?? certificateId),
    blobUrl: json.data?.blobUrl as string | undefined,
    points: typeof json.data?.points === "number" ? json.data.points : undefined,
    funnel: json.data?.funnel as Partial<{ currentStep: number; completedSteps: number[] }> | undefined,
  };
}

export async function postCertificateSharePreview(
  sessionToken: string,
  imageDataUrl: string
): Promise<{ shareUrl: string; shareSlug?: string }> {
  const res = await fetch("/api/certificate/share-preview", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ imageBase64: imageDataUrl }),
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? "Unable to prepare LinkedIn share");
  }
  const shareUrl = json.data?.shareUrl as string | undefined;
  if (!shareUrl) throw new Error("Missing share URL");
  return { shareUrl, shareSlug: json.data?.shareSlug as string | undefined };
}

export function safeCertificateFileBase(name: string) {
  return String(name ?? "certificate")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
