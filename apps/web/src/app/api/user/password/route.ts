import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { User } from "@hotornot/database";
import { requireAuth, hashPassword, verifyPassword } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { success: false, error: "请填写当前密码和新密码" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { success: false, error: "新密码至少 6 个字符" },
      { status: 400 }
    );
  }

  const user = await User.findById(authResult.userId);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "用户不存在" },
      { status: 404 }
    );
  }

  // Verify current password (bcrypt or legacy)
  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    // Check legacy
    const legacyHash = Buffer.from(currentPassword).toString("base64");
    if (user.password !== legacyHash) {
      return NextResponse.json(
        { success: false, error: "当前密码错误" },
        { status: 401 }
      );
    }
  }

  // Hash new password with bcrypt
  user.password = await hashPassword(newPassword);
  await user.save();

  return NextResponse.json({ success: true, message: "密码已更新" });
}
