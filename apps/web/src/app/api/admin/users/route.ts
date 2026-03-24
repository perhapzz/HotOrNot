import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const db = mongoose.connection.db!;
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const search = searchParams.get("search") || "";

  const filter: any = {};
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    db.collection("users")
      .find(filter, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection("users").countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    data: { users, total, page, totalPages: Math.ceil(total / limit) },
  });
}

export async function PATCH(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const db = mongoose.connection.db!;
  const { userId, action, value } = await request.json();

  if (!userId || !action) {
    return NextResponse.json({ success: false, error: "缺少参数" }, { status: 400 });
  }

  const oid = new mongoose.Types.ObjectId(userId);

  if (action === "ban") {
    await db.collection("users").updateOne({ _id: oid }, { $set: { banned: !!value } });
  } else if (action === "role") {
    if (!["user", "admin"].includes(value)) {
      return NextResponse.json({ success: false, error: "无效角色" }, { status: 400 });
    }
    await db.collection("users").updateOne({ _id: oid }, { $set: { role: value } });
  } else {
    return NextResponse.json({ success: false, error: "未知操作" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
