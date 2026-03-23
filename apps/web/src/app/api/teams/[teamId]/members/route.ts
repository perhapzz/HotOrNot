import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { Team } from "@hotornot/database";


// POST /api/teams/[teamId]/members — join via invite code or add member
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    await connectDatabase();
    const userId = getUserFromRequest(request)?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { inviteCode, targetUserId } = await request.json();

    const team = await Team.findById(params.teamId);
    if (!team) {
      return NextResponse.json({ success: false, error: "团队不存在" }, { status: 404 });
    }

    // Self-join via invite code
    if (inviteCode) {
      if (team.inviteCode !== inviteCode) {
        return NextResponse.json({ success: false, error: "邀请码无效" }, { status: 400 });
      }
      const already = team.members.find((m: any) => m.userId === userId);
      if (already) {
        return NextResponse.json({ success: false, error: "已是团队成员" }, { status: 400 });
      }
      if (team.members.length >= 20) {
        return NextResponse.json({ success: false, error: "团队人数已满（最多 20 人）" }, { status: 400 });
      }
      team.members.push({ userId, role: "member", joinedAt: new Date() } as any);
      await team.save();
      return NextResponse.json({ success: true, data: team });
    }

    // Admin adds member
    const caller = team.members.find((m: any) => m.userId === userId);
    if (!caller || !["owner", "admin"].includes(caller.role)) {
      return NextResponse.json({ success: false, error: "无权限添加成员" }, { status: 403 });
    }
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "请提供 targetUserId 或 inviteCode" }, { status: 400 });
    }
    const exists = team.members.find((m: any) => m.userId === targetUserId);
    if (exists) {
      return NextResponse.json({ success: false, error: "该用户已是团队成员" }, { status: 400 });
    }
    team.members.push({ userId: targetUserId, role: "member", joinedAt: new Date() } as any);
    await team.save();
    return NextResponse.json({ success: true, data: team });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/teams/[teamId]/members — remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    await connectDatabase();
    const userId = getUserFromRequest(request)?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    const team = await Team.findById(params.teamId);
    if (!team) {
      return NextResponse.json({ success: false, error: "团队不存在" }, { status: 404 });
    }

    // Self-leave
    if (targetUserId === userId || !targetUserId) {
      if (team.ownerId === userId) {
        return NextResponse.json({ success: false, error: "团队所有者不能退出，请先转让" }, { status: 400 });
      }
      team.members = team.members.filter((m: any) => m.userId !== userId);
      await team.save();
      return NextResponse.json({ success: true });
    }

    // Admin removes member
    const caller = team.members.find((m: any) => m.userId === userId);
    if (!caller || !["owner", "admin"].includes(caller.role)) {
      return NextResponse.json({ success: false, error: "无权限移除成员" }, { status: 403 });
    }
    team.members = team.members.filter((m: any) => m.userId !== targetUserId);
    await team.save();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
