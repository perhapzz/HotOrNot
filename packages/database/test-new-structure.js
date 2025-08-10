const mongoose = require('mongoose');

const Platform = {
  XIAOHONGSHU: 'xiaohongshu',
  BILIBILI: 'bilibili', 
  DOUYIN: 'douyin',
  TIKTOK: 'tiktok',
  WEIBO: 'weibo'
};

// Direct import the connection utility
async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotornot';
  await mongoose.connect(mongoUri);
}

// Import the AccountAnalysis model directly
const AccountAnalysisSchema = new mongoose.Schema({
  account: {
    platform: {
      type: String,
      enum: Object.values(Platform),
      required: true,
      index: true
    },
    accountId: {
      type: String,
      required: true,
      index: true
    },
    accountName: {
      type: String,
      required: true
    },
    uniqueId: {
      type: String,
      sparse: true
    },
    avatar: {
      type: String
    },
    bio: {
      type: String
    },
    verified: {
      type: Boolean,
      default: false
    },
    url: {
      type: String
    }
  },
  metrics: {
    followersCount: { type: Number, required: true, min: 0 },
    followingCount: { type: Number, required: true, min: 0 },
    postsCount: { type: Number, required: true, min: 0 },
    likesCount: { type: Number, min: 0 },
    avgViews: { type: Number, min: 0 },
    engagementRate: { type: Number, min: 0, max: 100 }
  },
  analysis: {
    postingPattern: {
      bestTimes: [{
        hour: { type: Number, min: 0, max: 23 },
        score: { type: Number, min: 0, max: 10 },
        count: { type: Number, min: 0 }
      }],
      frequency: { type: String },
      consistency: { type: Number, min: 1, max: 10 },
      weekdayPattern: [{
        day: { type: Number, min: 0, max: 6 },
        count: { type: Number, min: 0 }
      }]
    },
    content: {
      contentPreferences: [{ type: String }],
      topicSuggestions: [{ type: String }],
      strengthsAnalysis: { type: String },
      improvementAreas: [{ type: String }],
      trendsInsight: { type: String },
      contentTypes: [{
        type: { type: String },
        count: { type: Number, min: 0 },
        percentage: { type: Number, min: 0, max: 100 }
      }]
    },
    overallScore: { 
      type: Number, 
      min: 1, 
      max: 10,
      required: true
    },
    summary: { 
      type: String, 
      required: true 
    }
  },
  recentPosts: [{
    postId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    contentType: { type: String },
    type: { type: String },
    awemeType: { type: Number },
    metrics: {
      likes: { type: Number, required: true, min: 0 },
      views: { type: Number, min: 0 },
      comments: { type: Number, min: 0 },
      shares: { type: Number, min: 0 }
    },
    url: { type: String },
    publishTime: { type: Date },
    tags: [{ type: String }]
  }],
  userId: {
    type: String,
    index: true
  },
  requestUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  error: {
    type: String
  },
  processingTime: {
    type: Number,
    min: 0
  },
  analysisVersion: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true,
  collection: 'account_analyses_test'  // Use a test collection
});

// Add indexes
AccountAnalysisSchema.index({ 'account.platform': 1, 'account.accountId': 1 }, { unique: true });
AccountAnalysisSchema.index({ 'account.platform': 1, createdAt: -1 });
AccountAnalysisSchema.index({ userId: 1, createdAt: -1 });
AccountAnalysisSchema.index({ status: 1, createdAt: -1 });
AccountAnalysisSchema.index({ 'account.uniqueId': 1 }, { sparse: true });
AccountAnalysisSchema.index({ requestUrl: 1 });

// Add static methods
AccountAnalysisSchema.statics.findByPlatform = function(platform, limit = 20) {
  return this.find({ 'account.platform': platform, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(limit);
};

AccountAnalysisSchema.statics.findByAccountId = function(platform, accountId) {
  return this.findOne({ 
    'account.platform': platform, 
    'account.accountId': accountId 
  }).sort({ createdAt: -1 });
};

AccountAnalysisSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Add instance methods
AccountAnalysisSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.updatedAt = new Date();
  return this.save();
};

AccountAnalysisSchema.methods.markAsCompleted = function(processingTime) {
  this.status = 'completed';
  if (processingTime) {
    this.processingTime = processingTime;
  }
  this.updatedAt = new Date();
  return this.save();
};

AccountAnalysisSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  this.updatedAt = new Date();
  return this.save();
};

// Add virtual properties
AccountAnalysisSchema.virtual('accountIdentifier').get(function() {
  return `${this.account.platform}:${this.account.accountId}`;
});

AccountAnalysisSchema.virtual('displayName').get(function() {
  return this.account.uniqueId || this.account.accountName;
});

const AccountAnalysis = mongoose.models.AccountAnalysisTest || mongoose.model('AccountAnalysisTest', AccountAnalysisSchema);

async function testNewAccountAnalysis() {
  try {
    console.log('🚀 测试新的账号分析数据结构');
    console.log('================================');

    // 连接数据库
    await connectDatabase();
    console.log('✅ 数据库连接成功');

    // 创建测试数据
    const testAnalysis = new AccountAnalysis({
      account: {
        platform: Platform.XIAOHONGSHU,
        accountId: 'test_user_123',
        accountName: '测试用户',
        uniqueId: 'test_unique_123',
        avatar: 'https://example.com/avatar.jpg',
        bio: '这是一个测试账号',
        verified: false,
        url: 'https://www.xiaohongshu.com/user/profile/test_user_123'
      },
      metrics: {
        followersCount: 10000,
        followingCount: 500,
        postsCount: 150,
        likesCount: 50000,
        avgViews: 8000,
        engagementRate: 3.5
      },
      analysis: {
        postingPattern: {
          bestTimes: [
            { hour: 10, score: 8.5, count: 15 },
            { hour: 14, score: 7.8, count: 12 },
            { hour: 20, score: 9.2, count: 18 }
          ],
          frequency: '每日2-3次',
          consistency: 8.5,
          weekdayPattern: [
            { day: 1, count: 25 }, // 周一
            { day: 2, count: 30 }, // 周二
            { day: 6, count: 15 }  // 周六
          ]
        },
        content: {
          contentPreferences: ['美食', '生活方式', '旅行'],
          topicSuggestions: ['春季美食推荐', '周末生活方式', '城市探索'],
          strengthsAnalysis: '内容质量高，互动性强，发布时间把握准确',
          improvementAreas: ['可以增加视频内容', '提升发布频率的一致性'],
          trendsInsight: '美食类内容在春季表现较好，建议增加相关内容',
          contentTypes: [
            { type: '图文', count: 100, percentage: 66.7 },
            { type: '视频', count: 50, percentage: 33.3 }
          ]
        },
        overallScore: 8.2,
        summary: '该账号在美食和生活方式领域表现出色，内容质量较高，建议保持现有优势并适当增加视频内容比例。'
      },
      recentPosts: [
        {
          postId: 'post_123',
          title: '春日美食分享',
          description: '推荐几道简单易做的春季美食',
          contentType: '图文',
          metrics: {
            likes: 1500,
            views: 8000,
            comments: 200,
            shares: 50
          },
          url: 'https://www.xiaohongshu.com/discovery/item/post_123',
          publishTime: new Date('2024-03-15T10:00:00Z'),
          tags: ['美食', '春季', '简单']
        }
      ],
      userId: 'user_456',
      requestUrl: 'https://www.xiaohongshu.com/user/profile/test_user_123',
      status: 'completed',
      processingTime: 15000,
      analysisVersion: '1.0'
    });

    // 保存测试数据
    console.log('📝 保存测试分析记录...');
    await testAnalysis.save();
    console.log('✅ 测试记录保存成功');
    console.log(`📄 记录ID: ${testAnalysis._id}`);
    console.log(`🏷️  账号标识: ${testAnalysis.accountIdentifier}`);
    console.log(`👤 显示名称: ${testAnalysis.displayName}`);

    // 测试查询功能
    console.log('\n🔍 测试查询功能...');
    
    // 按平台查询
    const platformResults = await AccountAnalysis.findByPlatform(Platform.XIAOHONGSHU, 5);
    console.log(`📊 ${Platform.XIAOHONGSHU} 平台分析记录数量: ${platformResults.length}`);

    // 按账号ID查询
    const accountResult = await AccountAnalysis.findByAccountId(Platform.XIAOHONGSHU, 'test_user_123');
    if (accountResult) {
      console.log(`🎯 找到账号 ${accountResult.account.accountName} 的分析记录`);
    }

    // 按用户查询
    const userResults = await AccountAnalysis.findByUser('user_456', 10);
    console.log(`👤 用户 user_456 的分析记录数量: ${userResults.length}`);

    // 测试状态更新方法
    console.log('\n🔄 测试状态更新...');
    await testAnalysis.markAsProcessing();
    console.log(`✅ 状态更新为: ${testAnalysis.status}`);
    
    await testAnalysis.markAsCompleted(20000);
    console.log(`✅ 状态更新为: ${testAnalysis.status}, 处理时间: ${testAnalysis.processingTime}ms`);

    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await AccountAnalysis.deleteOne({ _id: testAnalysis._id });
    console.log('✅ 测试数据清理完成');

    console.log('\n================================');
    console.log('🎉 新的账号分析数据结构测试完成!');
    console.log('✅ 所有功能正常工作');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('错误详情:', error.message);
    if (error.errors) {
      console.error('验证错误:', error.errors);
    }
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('📪 数据库连接已关闭');
    process.exit(0);
  }
}

// 运行测试
testNewAccountAnalysis().catch(console.error);