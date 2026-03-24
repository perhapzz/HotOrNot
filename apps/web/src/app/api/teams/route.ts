import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { Team } from "@hotornot/database";
import crypto from "crypto";
export const dynamic = "force-dynamic";


// GET /api/teams — list my teams
export async function GET(request: NextRequest) {
  try {
    await connectDatabase();
    const userId = getUserFromRequest(request)?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const teams = await Team.find({ "members.userId": userId })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: teams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/teams — create team
export async function POST(request: NextRequest) {
  try {
    await connectDatabase();
    const userId = getUserFromRequest(request)?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await request.json();
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "团队名称不能为空" }, { status: 400 });
    }

    // Limit: max 5 teams per user as owner
    const ownedCount = await Team.countDocuments({ ownerId: userId });
    if (ownedCount >= 5) {
      return NextResponse.json({ success: false, error: "最多创建 5 个团队" }, { status: 400 });
    }

    const inviteCode = crypto.randomBytes(6).toString("hex");

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim(),
      ownerId: userId,
      members: [{ userId, role: "owner", joinedAt: new Date() }],
      inviteCode,
    });

    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
