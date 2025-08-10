import { NextRequest, NextResponse } from "next/server";
import { User } from "@hotornot/database";
import { connectDatabase } from "@hotornot/database/src/utils/connection";

// 简化版密码验证
function simpleHash(password: string): string {
  return Buffer.from(password).toString("base64");
}

// 简化版JWT生成
function generateSimpleToken(user: any): string {
  const payload = {
    userId: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    const { email, password, rememberMe } = await request.json();

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "邮箱和密码为必填项" },
        { status: 400 },
      );
    }

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "邮箱或密码错误" },
        { status: 401 },
      );
    }

    // 验证密码
    const hashedPassword = simpleHash(password);
    if (user.password !== hashedPassword) {
      return NextResponse.json(
        { success: false, error: "邮箱或密码错误" },
        { status: 401 },
      );
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await user.save();

    // 生成token
    const token = generateSimpleToken(user);
    const expiresIn = rememberMe ? "30d" : "7d";
    const maxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    // 设置cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: (() => {
          const userObj = user.toObject();
          delete userObj.password;
          return userObj;
        })(),
        token,
        expiresIn,
        authenticated: true,
        message: "登录成功",
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("登录失败:", error);

    // 处理MongoDB验证错误
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      return NextResponse.json(
        { success: false, error: messages[0] || "数据验证失败" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "服务器错误，请稍后重试" },
      { status: 500 },
    );
  }
}

// GET方法用于检查登录状态
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({
        success: true,
        data: { authenticated: false },
      });
    }

    // 解析token
    try {
      const payload = JSON.parse(Buffer.from(token, "base64").toString());

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
        data: {
          authenticated: true,
          user: userObj,
        },
      });
    } catch (tokenError) {
      return NextResponse.json({
        success: true,
        data: { authenticated: false },
      });
    }
  } catch (error: any) {
    console.error("状态检查失败:", error);

    // 处理MongoDB验证错误
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      return NextResponse.json(
        { success: false, error: messages[0] || "数据验证失败" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 },
    );
  }
}
