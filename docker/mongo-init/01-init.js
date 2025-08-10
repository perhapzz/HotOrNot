// MongoDB 初始化脚本
// 创建应用需要的数据库和集合

// 切换到 hotornot 数据库
db = db.getSiblingDB('hotornot');

// 创建应用用户
db.createUser({
  user: 'hotornot_user',
  pwd: 'hotornot_password',
  roles: [
    {
      role: 'readWrite',
      db: 'hotornot'
    }
  ]
});

// 创建必要的集合和索引
// 用户集合
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true, sparse: true });

// 用户分析记录集合
db.createCollection('user_analysis_records');
db.user_analysis_records.createIndex({ "userId": 1, "createdAt": -1 });
db.user_analysis_records.createIndex({ "sessionId": 1, "createdAt": -1 });
db.user_analysis_records.createIndex({ "platform": 1, "accountId": 1, "createdAt": -1 });
db.user_analysis_records.createIndex({ "status": 1, "createdAt": 1 });
db.user_analysis_records.createIndex({ "analysisType": 1, "platform": 1, "createdAt": -1 });
db.user_analysis_records.createIndex({ "userIP": 1, "createdAt": -1 });
db.user_analysis_records.createIndex({ "dataQuality": 1, "createdAt": -1 });

// 内容分析集合
db.createCollection('content_analyses');
db.content_analyses.createIndex({ "url": 1 });
db.content_analyses.createIndex({ "platform": 1, "createdAt": -1 });
db.content_analyses.createIndex({ "status": 1, "updatedAt": -1 });

// 账号分析集合
db.createCollection('account_analyses');
db.account_analyses.createIndex({ "platform": 1, "accountId": 1 });
db.account_analyses.createIndex({ "status": 1, "updatedAt": -1 });

// 关键词分析集合
db.createCollection('keyword_analyses');
db.keyword_analyses.createIndex({ "keyword": 1, "platforms": 1 });
db.keyword_analyses.createIndex({ "status": 1, "updatedAt": -1 });

// 小红书热榜集合
db.createCollection('xiaohongshu_hotlists');
db.xiaohongshu_hotlists.createIndex({ "date": 1 });
db.xiaohongshu_hotlists.createIndex({ "rank": 1 });

// 抖音热榜集合
db.createCollection('douyin_hotlists');
db.douyin_hotlists.createIndex({ "date": 1 });
db.douyin_hotlists.createIndex({ "rank": 1 });

print('MongoDB 初始化完成！');