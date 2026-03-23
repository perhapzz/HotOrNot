import { NextRequest, NextResponse } from "next/server";
import { User } from "@hotornot/database";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import {
  verifyPassword,
  generateToken,
  setAuthCookie,
  getUserFromRequest,
} from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "邮箱和密码为必填项" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      // Fallback: check legacy base64 password for migration
      const legacyHash = Buffer.from(password).toString("base64");
      if (user.password === legacyHash) {
        // Migrate to bcrypt on successful legacy login
        const { hashPassword } = await import("../../../../lib/auth");
        const newHash = await hashPassword(password);
        await User.updateOne({ _id: user._id }, { password: newHash });
        console.log(`[AUTH] Password migrated to bcrypt for user ${user._id} (${user.email})`);
        user.password = newHash;
      } else {
        return NextResponse.json(
          { success: false, error: "邮箱或密码错误" },
          { status: 401 }
        );
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const userObj = user.toObject();
    delete userObj.password;

    const response = NextResponse.json({
      success: true,
      data: {
        user: userObj,
        token,
        expiresIn: rememberMe ? "30d" : "7d",
        authenticated: true,
        message: "登录成功",
      },
    });

    setAuthCookie(response, token, rememberMe);
    return response;
  } catch (error: any) {
    console.error("登录失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

// GET — check login status
export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({
        success: true,
        data: { authenticated: false },
      });
    }

    await connectDatabase();
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({
        success: true,
        data: { authenticated: false },
      });
    }

    const userObj = user.toObject();
    delete userObj.password;

    return NextResponse.json({
      success: true,
      data: { authenticated: true, user: userObj },
    });
  } catch (error: any) {
    console.error("状态检查失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
