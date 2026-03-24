import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { ApiKey } from "@hotornot/database";
import crypto from "crypto";
export const dynamic = "force-dynamic";


// GET /api/developer/keys — list my API keys
export async function GET(request: NextRequest) {
  try {
    await connectDatabase();
    const userId = getUserFromRequest(request)?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const keys = await ApiKey.find({ userId })
      .select("-key") // hide full key in list
      .sort({ createdAt: -1 })
      .lean();

    // Show only last 8 chars of key
    const masked = keys.map((k: any) => ({
      ...k,
      keyPreview: `hon_...${k._id.toString().slice(-8)}`,
    }));

    return NextResponse.json({ success: true, data: masked });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/developer/keys — create new API key
export async function POST(request: NextRequest) {
  try {
    await connectDatabase();
    const userId = getUserFromRequest(request)?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name, permissions } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "API key 名称不能为空" }, { status: 400 });
    }

    // Max 5 keys per user
    const count = await ApiKey.countDocuments({ userId });
    if (count >= 5) {
      return NextResponse.json({ success: false, error: "最多创建 5 个 API key" }, { status: 400 });
    }

    const key = `hon_${crypto.randomBytes(24).toString("hex")}`;
    const validPerms = ["analysis:content", "analysis:keyword", "hotlist:read"];
    const perms = Array.isArray(permissions)
      ? permissions.filter((p: string) => validPerms.includes(p))
      : validPerms;

    const apiKey = await ApiKey.create({
      key,
      userId,
      name: name.trim(),
      permissions: perms,
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: apiKey._id,
        key, // Show full key only on creation
        name: apiKey.name,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/developer/keys — delete key by id
export async function DELETE(request: NextRequest) {
  try {
    await connectDatabase();
    const userId = getUserFromRequest(request)?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = await request.json();
    if (!keyId) {
      return NextResponse.json({ success: false, error: "缺少 keyId" }, { status: 400 });
    }

    const result = await ApiKey.deleteOne({ _id: keyId, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "API key 不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
