import { NextRequest, NextResponse } from "next/server";
import { User } from "@hotornot/database";
import { connectDatabase } from "@hotornot/database/src/utils/connection";

// 简化版密码加密
function simpleHash(password: string): string {
  return Buffer.from(password).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    const { email, password, displayName } = await request.json();

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "邮箱和密码为必填项" },
        { status: 400 },
      );
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { success: false, error: "邮箱已被注册" },
        { status: 409 },
      );
    }

    // 自动生成用户名（使用邮箱前缀，如果冲突则添加随机数字）
    let baseUsername = email.split("@")[0];
    let username = baseUsername;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // 创建新用户
    const hashedPassword = simpleHash(password);
    const newUser = new User({
      email,
      username,
      displayName: displayName || baseUsername,
      password: hashedPassword,
      role: "user",
      status: "active",
      emailVerified: true, // 简化版，直接设为已验证
      preferences: {
        notifications: {
          email: true,
          browser: true,
          analysis: true,
          weekly: true,
        },
        theme: "auto",
        language: "zh-CN",
      },
      stats: {
        totalAnalyses: 0,
        contentAnalyses: 0,
        accountAnalyses: 0,
        keywordAnalyses: 0,
      },
      subscription: {
        plan: "free",
        status: "active",
        cancelAtPeriodEnd: false,
      },
    });

    await newUser.save();

    // 返回成功响应（不包含密码）
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json(
      {
        success: true,
        data: {
          user: userResponse,
          message: "注册成功",
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("注册失败:", error);

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

    // 处理MongoDB重复键错误
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName =
        field === "email" ? "邮箱" : field === "username" ? "用户名" : "字段";
      return NextResponse.json(
        { success: false, error: `${fieldName}已被使用` },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "服务器错误，请稍后重试" },
      { status: 500 },
    );
  }
}
