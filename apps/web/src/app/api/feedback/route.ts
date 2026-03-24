import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { Feedback } from "@hotornot/database";
import { getUserFromRequest } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await connectDatabase();

  const user = getUserFromRequest(request);
  const { analysisId, analysisType, rating, comment } = await request.json();

  if (!analysisId || !analysisType || !rating) {
    return NextResponse.json(
      { success: false, error: "缺少必要参数" },
      { status: 400 }
    );
  }

  if (!["up", "down"].includes(rating)) {
    return NextResponse.json(
      { success: false, error: "rating 必须为 up 或 down" },
      { status: 400 }
    );
  }

  const feedback = await Feedback.create({
    analysisId,
    analysisType,
    userId: user?.userId,
    rating,
    comment: (comment || "").slice(0, 500),
  });

  return NextResponse.json({ success: true, data: feedback }, { status: 201 });
}
