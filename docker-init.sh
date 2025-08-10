#!/bin/bash
# Docker容器启动后自动启动调度器的脚本

echo "🔄 等待应用启动..."
sleep 10

echo "🔄 检查应用是否可访问..."
until curl -f http://localhost:3000/api/scheduler > /dev/null 2>&1; do
    echo "⏳ 等待应用启动完成..."
    sleep 5
done

echo "✅ 应用已启动，开始初始化调度器..."

# 检查调度器状态
SCHEDULER_STATUS=$(curl -s http://localhost:3000/api/scheduler | jq -r '.data.isRunning')

if [ "$SCHEDULER_STATUS" != "true" ]; then
    echo "🚀 启动调度器..."
    curl -X POST http://localhost:3000/api/scheduler \
         -H "Content-Type: application/json" \
         -d '{"action": "start"}' \
         -s | jq '.'
    
    echo "🔄 手动触发热点数据更新..."
    curl -X POST http://localhost:3000/api/scheduler \
         -H "Content-Type: application/json" \
         -d '{"action": "update_now"}' \
         -s | jq '.'
    
    echo "✅ 调度器初始化完成！"
else
    echo "✅ 调度器已在运行中"
fi

echo "🎉 Docker容器初始化完成！"