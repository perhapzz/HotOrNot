import { NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { User } from "@hotornot/database";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authResult = requireAdmin(request as any);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();

  const totalUsers = await User.countDocuments();

  // Legacy base64 passwords are short (typically < 100 chars)
  // bcrypt hashes always start with $2a$ or $2b$ and are 60 chars
  const migratedUsers = await User.countDocuments({
    password: { $regex: /^\$2[aby]\$/ },
  });

  const legacyUsers = totalUsers - migratedUsers;

  return NextResponse.json({
    success: true,
    data: {
      totalUsers,
      migratedUsers,
      legacyUsers,
      migrationComplete: legacyUsers === 0,
      migrationPercent:
        totalUsers > 0
          ? Math.round((migratedUsers / totalUsers) * 100)
          : 100,
    },
  });
}
