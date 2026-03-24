import { NextRequest, NextResponse } from "next/server";
import { KeywordAnalysis } from "@hotornot/database";
import { requireAdmin } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    console.log("🔄 开始数据库迁移：为 keyword_analyses 集合添加图片字段");

    // 获取原生 MongoDB 集合以进行底层操作
    const collection = KeywordAnalysis.collection;

    // 检查现有记录数量
    const totalCount = await collection.countDocuments();
    console.log(`📊 现有记录数量: ${totalCount}`);

    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        message: "没有现有记录，无需迁移",
        migratedCount: 0,
      });
    }

    // 查看现有记录的字段结构
    const sample = await collection.findOne({});
    console.log("🔍 现有记录字段:", Object.keys(sample || {}));
    if (
      sample?.topContent &&
      Array.isArray(sample.topContent) &&
      sample.topContent[0]
    ) {
      console.log(
        "🔍 现有topContent[0]字段:",
        Object.keys(sample.topContent[0]),
      );
    }

    // 检查是否需要迁移
    const needsTopContentMigration = await collection.countDocuments({
      "topContent.0.authorAvatar": { $exists: false },
    });

    const needsTopAuthorsMigration = await collection.countDocuments({
      "searchStats.topAuthors.0.totalLikes": { $exists: false },
    });

    console.log(`🔍 需要topContent迁移的记录数量: ${needsTopContentMigration}`);
    console.log(`🔍 需要topAuthors迁移的记录数量: ${needsTopAuthorsMigration}`);

    if (needsTopContentMigration === 0 && needsTopAuthorsMigration === 0) {
      return NextResponse.json({
        success: true,
        message: "所有记录已包含完整字段，无需迁移",
        migratedCount: 0,
      });
    }

    // 执行迁移：为每条记录的 topContent 和 searchStats.topAuthors 添加缺失的字段
    const result = await collection.updateMany(
      {
        $or: [
          {
            topContent: { $exists: true, $ne: [] },
            "topContent.0.authorAvatar": { $exists: false },
          },
          {
            "searchStats.topAuthors": { $exists: true, $ne: [] },
            "searchStats.topAuthors.0.totalLikes": { $exists: false },
          },
        ],
      },
      [
        {
          $set: {
            topContent: {
              $cond: {
                if: { $isArray: "$topContent" },
                then: {
                  $map: {
                    input: "$topContent",
                    as: "item",
                    in: {
                      $mergeObjects: [
                        "$$item",
                        {
                          authorId: { $ifNull: ["$$item.authorId", ""] },
                          authorAvatar: {
                            $ifNull: ["$$item.authorAvatar", ""],
                          },
                          coverImage: { $ifNull: ["$$item.coverImage", ""] },
                          images: { $ifNull: ["$$item.images", []] },
                        },
                      ],
                    },
                  },
                },
                else: "$topContent",
              },
            },
            "searchStats.topAuthors": {
              $cond: {
                if: { $isArray: "$searchStats.topAuthors" },
                then: {
                  $map: {
                    input: "$searchStats.topAuthors",
                    as: "author",
                    in: {
                      $mergeObjects: [
                        {
                          name: {
                            $ifNull: [
                              "$$author.nickname",
                              { $ifNull: ["$$author.name", ""] },
                            ],
                          },
                          count: {
                            $ifNull: [
                              "$$author.post_count",
                              { $ifNull: ["$$author.count", 0] },
                            ],
                          },
                          totalLikes: { $ifNull: ["$$author.totalLikes", 0] },
                        },
                      ],
                    },
                  },
                },
                else: { $ifNull: ["$searchStats.topAuthors", []] },
              },
            },
          },
        },
      ],
    );

    console.log(`✅ 迁移完成！更新了 ${result.modifiedCount} 条记录`);

    // 验证迁移结果
    const updatedSample = await collection.findOne({});
    console.log("🔍 迁移后记录字段:", Object.keys(updatedSample || {}));
    if (
      updatedSample?.topContent &&
      Array.isArray(updatedSample.topContent) &&
      updatedSample.topContent[0]
    ) {
      console.log(
        "🔍 迁移后topContent[0]字段:",
        Object.keys(updatedSample.topContent[0]),
      );
      console.log(
        "🔍 迁移后topContent[0]数据:",
        JSON.stringify(updatedSample.topContent[0], null, 2),
      );
    }

    return NextResponse.json({
      success: true,
      message: `数据库迁移成功！更新了 ${result.modifiedCount} 条记录`,
      migratedCount: result.modifiedCount,
      totalCount,
      sampleRecord: updatedSample?.topContent?.[0],
    });
  } catch (error) {
    console.error("❌ 数据库迁移失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "数据库迁移失败",
      },
      { status: 500 },
    );
  }
}
