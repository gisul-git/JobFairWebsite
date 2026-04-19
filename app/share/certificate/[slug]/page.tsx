import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { connectDB } from "@/lib/mongodb";
import { publicSiteOriginFromHeaders } from "@/lib/public-site-url";
import { User } from "@/models/User";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;
  await connectDB();
  const user = await User.findOne({ "certificate.shareSlug": slug }).select("name").lean();
  if (!user) {
    return { title: "GISUL Certificate" };
  }

  const base = publicSiteOriginFromHeaders(headers()).replace(/\/$/, "");
  if (!base) {
    return { title: "GISUL Certificate" };
  }
  const pageUrl = `${base}/share/certificate/${slug}`;
  /** Same-origin image so LinkedIn/Facebook crawlers can fetch it (SAS blob URLs are often skipped). */
  const imageUrl = `${base}/api/certificate/og-image/${slug}`;

  const name = String((user as { name?: string }).name ?? "GISUL learner");
  const title = `Certificate of Completion — ${name} | GISUL`;
  const description =
    `${name} completed the GISUL Job Fair program (AI Fundamentals & Soft Skills for the Future). View certificate.`;

  return {
    metadataBase: new URL(`${base}/`),
    title,
    description,
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    alternates: { canonical: pageUrl },
    openGraph: {
      url: pageUrl,
      siteName: "GISUL",
      title,
      description,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1122,
          height: 794,
          alt: `GISUL certificate — ${name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ShareCertificatePage({ params }: Props) {
  await connectDB();
  const user = await User.findOne({ "certificate.shareSlug": params.slug }).select("name").lean();
  if (!user) notFound();

  const base = publicSiteOriginFromHeaders(headers()).replace(/\/$/, "");
  const imageUrl = base ? `${base}/api/certificate/og-image/${params.slug}` : "";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0d0d1a,#151528)",
        padding: "32px 16px",
        color: "#f1dcba",
        fontFamily: "system-ui,sans-serif",
      }}
    >
      <p style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 12, color: "#f4e401", marginBottom: 16 }}>
        GISUL
      </p>
      <h1 style={{ textAlign: "center", fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>
        Certificate of completion
      </h1>
      <p style={{ textAlign: "center", fontSize: 14, opacity: 0.85, marginBottom: 24, color: "#f1dcba" }}>
        {(user as { name?: string }).name ?? "Learner"}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- same-origin OG proxy */}
      <img
        src={imageUrl || undefined}
        alt="GISUL certificate of completion"
        width={1122}
        height={794}
        style={{
          maxWidth: "min(1122px, 100%)",
          height: "auto",
          margin: "0 auto",
          display: "block",
          borderRadius: 8,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      />
      <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, opacity: 0.75 }}>
        Download your PDF from the GISUL job fair portal.
      </p>
    </main>
  );
}
