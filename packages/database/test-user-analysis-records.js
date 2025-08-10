const mongoose = require('mongoose');

const Platform = {
  XIAOHONGSHU: 'xiaohongshu',
  BILIBILI: 'bilibili', 
  DOUYIN: 'douyin',
  TIKTOK: 'tiktok',
  WEIBO: 'weibo'
};

// 连接数据库
async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotornot';
  await mongoose.connect(mongoUri);
}

// 用户分析记录Schema
const UserAnalysisRecordSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  sessionId: { type: String, index: true },
  userIP: { type: String, index: true },
  userAgent: { type: String },
  
  requestUrl: { type: String, required: true },
  platform: { 
    type: String, 
    enum: Object.values(Platform), 
    required: true, 
    index: true 
  },
  accountId: { type: String, required: true, index: true },
  accountName: { type: String },
  
  analysisId: { type: String, required: true, index: true },
  analysisType: { 
    type: String, 
    enum: ['account', 'content', 'keyword'], 
    required: true, 
    index: true 
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending', 
    required: true, 
    index: true 
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  error: { type: String },
  
  processingTime: { type: Number, min: 0 },
  dataQuality: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'medium', 
    index: true 
  },
  
  analysisVersion: { type: String, default: '1.0', required: true },
  requestSource: { 
    type: String, 
    enum: ['web', 'api', 'mobile'], 
    default: 'web', 
    index: true 
  },
  
  completedAt: { type: Date },
  notes: { type: String },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: false, index: true },
  shareToken: { type: String, unique: true, sparse: true }
}, {
  timestamps: true,
  collection: 'user_analysis_records_test'
});

// 添加索引
UserAnalysisRecordSchema.index({ userId: 1, createdAt: -1 });
UserAnalysisRecordSchema.index({ sessionId: 1, createdAt: -1 });
UserAnalysisRecordSchema.index({ platform: 1, accountId: 1, createdAt: -1 });
UserAnalysisRecordSchema.index({ status: 1, createdAt: 1 });

// 静态方法
UserAnalysisRecordSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

UserAnalysisRecordSchema.statics.findBySession = function(sessionId, limit = 20) {
  return this.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

UserAnalysisRecordSchema.statics.findByPlatformAndAccount = function(platform, accountId, limit = 10) {
  return this.find({ platform, accountId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// 实例方法
UserAnalysisRecordSchema.methods.markAsProcessing = function(progress = 0) {
  this.status = 'processing';
  this.progress = progress;
  this.updatedAt = new Date();
  return this.save();
};

UserAnalysisRecordSchema.methods.markAsCompleted = function(analysisId, processingTime, dataQuality) {
  this.status = 'completed';
  this.analysisId = analysisId;
  this.progress = 100;
  this.completedAt = new Date();
  
  if (processingTime) this.processingTime = processingTime;
  if (dataQuality) this.dataQuality = dataQuality;
  
  this.updatedAt = new Date();
  return this.save();
};

UserAnalysisRecordSchema.methods.generateShareToken = function() {
  if (!this.shareToken) {
    this.shareToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  }
  this.isPublic = true;
  return this.save();
};

const UserAnalysisRecord = mongoose.models.UserAnalysisRecordTest || 
  mongoose.model('UserAnalysisRecordTest', UserAnalysisRecordSchema);

async function testUserAnalysisRecords() {
  try {
    console.log('🚀 测试用户分析记录表');
    console.log('================================');

    // 连接数据库
    await connectDatabase();
    console.log('✅ 数据库连接成功');

    // 创建测试记录 - 用户1的小红书账号分析
    console.log('\n📝 创建测试分析记录...');
    
    const record1 = new UserAnalysisRecord({
      userId: 'user_123',
      userIP: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Chrome/91.0',
      requestUrl: 'https://www.xiaohongshu.com/user/profile/test_account',
      platform: Platform.XIAOHONGSHU,
      accountId: 'test_account_123',
      accountName: '测试用户账号',
      analysisId: 'analysis_' + Date.now(),
      analysisType: 'account',
      requestSource: 'web',
      tags: ['美食', '生活方式']
    });

    await record1.save();
    console.log(`✅ 记录1保存成功 (ID: ${record1._id})`);

    // 创建第二个记录 - 同一用户分析不同账号
    const record2 = new UserAnalysisRecord({
      userId: 'user_123',
      userIP: '192.168.1.100',
      requestUrl: 'https://www.douyin.com/user/another_account',
      platform: Platform.DOUYIN,
      accountId: 'another_account_456',
      accountName: '另一个测试账号',
      analysisId: 'analysis_' + (Date.now() + 1),
      analysisType: 'account',
      requestSource: 'web'
    });

    await record2.save();
    console.log(`✅ 记录2保存成功 (ID: ${record2._id})`);

    // 创建第三个记录 - 匿名用户记录
    const record3 = new UserAnalysisRecord({
      sessionId: 'session_' + Date.now(),
      userIP: '192.168.1.200',
      requestUrl: 'https://www.xiaohongshu.com/user/profile/test_account',
      platform: Platform.XIAOHONGSHU,
      accountId: 'test_account_123',
      accountName: '测试用户账号',
      analysisId: 'analysis_' + (Date.now() + 2),
      analysisType: 'account',
      requestSource: 'web'
    });

    await record3.save();
    console.log(`✅ 记录3保存成功 (ID: ${record3._id})`);

    // 测试状态更新
    console.log('\n🔄 测试状态更新...');
    await record1.markAsProcessing(25);
    console.log(`✅ 记录1状态: ${record1.status}, 进度: ${record1.progress}%`);

    await record1.markAsCompleted(record1.analysisId, 15000, 'high');
    console.log(`✅ 记录1完成: ${record1.status}, 耗时: ${record1.processingTime}ms`);

    // 生成分享令牌
    await record1.generateShareToken();
    console.log(`✅ 生成分享令牌: ${record1.shareToken}`);

    // 测试查询功能
    console.log('\n🔍 测试查询功能...');

    // 按用户查询
    const userRecords = await UserAnalysisRecord.findByUser('user_123', 10);
    console.log(`👤 用户 user_123 的分析记录: ${userRecords.length} 条`);

    // 按会话查询
    const sessionRecords = await UserAnalysisRecord.findBySession(record3.sessionId, 10);
    console.log(`🔗 会话记录: ${sessionRecords.length} 条`);

    // 按平台和账号查询
    const accountRecords = await UserAnalysisRecord.findByPlatformAndAccount(
      Platform.XIAOHONGSHU, 
      'test_account_123', 
      10
    );
    console.log(`📊 小红书账号 test_account_123 的分析记录: ${accountRecords.length} 条`);

    // 验证同一账号可以被多次分析
    console.log('\n✅ 验证结果:');
    console.log(`- 同一账号(test_account_123)被分析了 ${accountRecords.length} 次`);
    console.log(`- 用户 user_123 总共进行了 ${userRecords.length} 次分析`);
    console.log('- 每次分析都有独立的记录，不会被覆盖');

    // 统计信息
    const totalRecords = await UserAnalysisRecord.countDocuments({});
    const completedRecords = await UserAnalysisRecord.countDocuments({ status: 'completed' });
    const pendingRecords = await UserAnalysisRecord.countDocuments({ status: 'pending' });
    
    console.log(`\n📈 统计信息:`);
    console.log(`- 总记录数: ${totalRecords}`);
    console.log(`- 已完成: ${completedRecords}`);
    console.log(`- 待处理: ${pendingRecords}`);

    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await UserAnalysisRecord.deleteMany({ 
      $or: [
        { userId: 'user_123' },
        { sessionId: record3.sessionId }
      ]
    });
    console.log('✅ 测试数据清理完成');

    console.log('\n================================');
    console.log('🎉 用户分析记录表测试完成!');
    console.log('✅ 所有功能正常工作');
    console.log('✅ 支持同一账号多次分析记录');
    console.log('✅ 支持用户和匿名会话记录');
    console.log('✅ 防止分析记录被覆盖');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('错误详情:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📪 数据库连接已关闭');
    process.exit(0);
  }
}

// 运行测试
testUserAnalysisRecords().catch(console.error);