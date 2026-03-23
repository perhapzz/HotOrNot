import { NextRequest, NextResponse } from "next/server";
import { connectDatabase, NotificationConfig } from "@hotornot/database";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "anonymous";
    await connectDatabase();

    const config = await NotificationConfig.findOne({ userId }).lean();
    return NextResponse.json({ success: true, data: config || null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "anonymous";
    const body = await request.json();

    await connectDatabase();

    const config = await NotificationConfig.findOneAndUpdate(
      { userId },
      {
        $set: {
          channels: body.channels || [],
          rules: body.rules || [],
          enabled: body.enabled !== false,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
