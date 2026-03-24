import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { UserFavorite } from "@hotornot/database";
import { requireAuth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();

  const favorites = await UserFavorite.find({ userId: authResult.userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, data: favorites });
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();

  const { analysisId, analysisType, title } = await request.json();

  if (!analysisId || !analysisType) {
    return NextResponse.json(
      { success: false, error: "缺少必要参数" },
      { status: 400 }
    );
  }

  // Upsert — prevent duplicates
  const favorite = await UserFavorite.findOneAndUpdate(
    { userId: authResult.userId, analysisId },
    { analysisType, title: title || "" },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true, data: favorite }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();

  const { analysisId } = await request.json();

  if (!analysisId) {
    return NextResponse.json(
      { success: false, error: "缺少 analysisId" },
      { status: 400 }
    );
  }

  await UserFavorite.deleteOne({
    userId: authResult.userId,
    analysisId,
  });

  return NextResponse.json({ success: true });
}
