import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function requireAdmin(request: Request) {
  // Primary check: authenticated NextAuth admin session.
  const session = await auth();
  if (session?.user?.isAdmin) {
    return { ok: true as const, adminUser: session.user };
  }

  // Backward-compatible fallback for existing client calls using x-user-id.
  await connectDB();
  const userId =
    request.headers.get("x-user-id") ?? request.headers.get("x-admin-user-id");

  if (!userId) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  const adminUser = await User.findById(userId).lean();
  if (!adminUser || adminUser.isAdmin !== true) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }

  return { ok: true as const, adminUser };
}

