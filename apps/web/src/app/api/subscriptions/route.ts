import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { Subscription } from "@hotornot/database";
import { requireAuth } from "@/lib/auth";

const MAX_SUBSCRIPTIONS = 20;

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const subs = await Subscription.find({ userId: authResult.userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, data: subs });
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const { type, target, platform, frequency } = await request.json();

  if (!type || !target) {
    return NextResponse.json({ success: false, error: "缺少 type 或 target" }, { status: 400 });
  }

  // Check limit
  const count = await Subscription.countDocuments({ userId: authResult.userId });
  if (count >= MAX_SUBSCRIPTIONS) {
    return NextResponse.json(
      { success: false, error: `最多订阅 ${MAX_SUBSCRIPTIONS} 个目标` },
      { status: 400 }
    );
  }

  const sub = await Subscription.findOneAndUpdate(
    { userId: authResult.userId, type, target },
    { platform, frequency: frequency || "daily", active: true },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true, data: sub }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const { subscriptionId } = await request.json();

  if (!subscriptionId) {
    return NextResponse.json({ success: false, error: "缺少 subscriptionId" }, { status: 400 });
  }

  await Subscription.deleteOne({ _id: subscriptionId, userId: authResult.userId });

  return NextResponse.json({ success: true });
}
