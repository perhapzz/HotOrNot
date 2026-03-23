import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, hasPermission, ApiKeyContext } from "../../../../../lib/api-key-auth";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import mongoose from "mongoose";

const MODEL_MAP: Record<string, string> = {
  douyin: "DouyinHotList",
  xiaohongshu: "XiaohongshuHotList",
  bilibili: "BilibiliHotList",
  weibo: "WeiboHotList",
};

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const authResult = await validateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const ctx = authResult as ApiKeyContext;

  if (!hasPermission(ctx, "hotlist:read")) {
    return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
  }

  const platform = params.platform.toLowerCase();
  const modelName = MODEL_MAP[platform];
  if (!modelName) {
    return NextResponse.json(
      { success: false, error: `Unknown platform: ${platform}. Supported: ${Object.keys(MODEL_MAP).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    await connectDatabase();
    const Model = mongoose.models[modelName];
    if (!Model) {
      return NextResponse.json({ success: false, error: "Model not found" }, { status: 500 });
    }

    const latest = await Model.findOne().sort({ fetchedAt: -1 }).lean();
    if (!latest) {
      return NextResponse.json({ success: true, data: null, message: "No data available yet" });
    }

    return NextResponse.json({
      success: true,
      data: {
        platform,
        fetchedAt: (latest as any).fetchedAt,
        items: (latest as any).items || (latest as any).hotList || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
