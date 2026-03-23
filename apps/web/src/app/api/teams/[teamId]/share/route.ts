import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { Team, SharedAnalysis } from "@hotornot/database";


// POST /api/teams/[teamId]/share — share analysis to team
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

    const team = await Team.findById(params.teamId);
    if (!team) {
      return NextResponse.json({ success: false, error: "团队不存在" }, { status: 404 });
    }

    const isMember = team.members.some((m: any) => m.userId === userId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "非团队成员" }, { status: 403 });
    }

    const { analysisId, analysisType, note } = await request.json();
    if (!analysisId || !analysisType) {
      return NextResponse.json({ success: false, error: "缺少 analysisId 或 analysisType" }, { status: 400 });
    }

    // Check duplicate
    const exists = await SharedAnalysis.findOne({
      analysisId,
      teamId: params.teamId,
    });
    if (exists) {
      return NextResponse.json({ success: false, error: "该分析已分享到此团队" }, { status: 400 });
    }

    const shared = await SharedAnalysis.create({
      analysisId,
      analysisType,
      teamId: params.teamId,
      sharedBy: userId,
      note: note?.trim(),
    });

    return NextResponse.json({ success: true, data: shared }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET /api/teams/[teamId]/share — list shared analyses
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    await connectDatabase();
    const userId = getUserFromRequest(request)?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const team = await Team.findById(params.teamId);
    if (!team) {
      return NextResponse.json({ success: false, error: "团队不存在" }, { status: 404 });
    }

    const isMember = team.members.some((m: any) => m.userId === userId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "非团队成员" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

    const [items, total] = await Promise.all([
      SharedAnalysis.find({ teamId: params.teamId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SharedAnalysis.countDocuments({ teamId: params.teamId }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
