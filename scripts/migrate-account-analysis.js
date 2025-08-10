#!/usr/bin/env node

/**
 * 账号分析数据库迁移脚本
 * 
 * 使用方法：
 * node scripts/migrate-account-analysis.js
 * 
 * 或者通过 npm script：
 * npm run migrate:account-analysis
 */

const mongoose = require('mongoose');
const path = require('path');

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 导入迁移类
async function runMigration() {
  try {
    console.log('🚀 开始账号分析数据迁移...');
    console.log('========================');

    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotornot';
    console.log(`📍 连接数据库: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功');

    // 动态导入 ES 模块
    const { AccountAnalysisMigration } = await import('../packages/database/src/migrations/account-analysis-migration.js');

    // 检查是否需要迁移
    console.log('🔍 检查迁移状态...');
    const needsMigration = await AccountAnalysisMigration.needsMigration();

    if (!needsMigration) {
      console.log('✅ 数据库已经是最新格式，无需迁移');
      return;
    }

    // 执行迁移
    console.log('📦 开始执行迁移...');
    const startTime = Date.now();
    
    await AccountAnalysisMigration.run();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`✅ 迁移完成! 耗时: ${duration}秒`);

    // 验证迁移结果
    console.log('🔍 验证迁移结果...');
    const isValid = await AccountAnalysisMigration.validateMigration();
    
    if (isValid) {
      console.log('✅ 迁移验证成功');
    } else {
      console.log('❌ 迁移验证失败，请检查数据');
    }

    console.log('========================');
    console.log('🎉 账号分析数据迁移流程完成!');

  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('📪 数据库连接已关闭');
    process.exit(0);
  }
}

// 处理未捕获的错误
process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的 Promise 拒绝:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 运行迁移
runMigration();