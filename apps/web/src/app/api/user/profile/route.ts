import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { User } from "@hotornot/database";
import { requireAuth } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();

  const { username } = await request.json();

  if (!username || username.trim().length < 2) {
    return NextResponse.json(
      { success: false, error: "用户名至少 2 个字符" },
      { status: 400 }
    );
  }

  const user = await User.findByIdAndUpdate(
    authResult.userId,
    { username: username.trim() },
    { new: true, select: "username email" }
  );

  if (!user) {
    return NextResponse.json(
      { success: false, error: "用户不存在" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { username: user.username, email: user.email },
  });
}
