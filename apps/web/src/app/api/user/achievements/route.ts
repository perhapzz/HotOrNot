import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserAchievements, checkAchievements } from "@/lib/achievements";

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const achievements = await getUserAchievements(authResult.userId);

  return NextResponse.json({ success: true, data: achievements });
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const newlyUnlocked = await checkAchievements(authResult.userId);

  return NextResponse.json({
    success: true,
    data: {
      newlyUnlocked: newlyUnlocked.map((a) => ({
        id: a.id,
        emoji: a.emoji,
        name: a.name,
        description: a.description,
      })),
    },
  });
}
