import { connectDB } from "@/lib/mongodb";
import { readBlobBuffer } from "@/lib/azure-blob";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin PNG for LinkedIn / Facebook Open Graph crawlers (they often fail on Azure SAS URLs).
 */
export async function GET(_req: Request, context: { params: { slug: string } }): Promise<Response> {
  try {
    const slug = context.params.slug?.trim();
    if (!slug) {
      return new Response("Bad request", { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ "certificate.shareSlug": slug }).select("_id").lean();
    if (!user) {
      return new Response("Not found", { status: 404 });
    }

    const blobName = `cert-share/${slug}.png`;
    const buffer = await readBlobBuffer(blobName);
    if (!buffer?.length) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=1800",
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
