#!/bin/sh
# 启动脚本：先启动Next.js应用，然后自动启动调度器

echo "🚀 启动 HotOrNot 应用..."

# 在后台启动Next.js应用
node apps/web/server.js &
APP_PID=$!

echo "⏳ 等待应用启动..."
sleep 15

# 检查应用是否启动成功
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # 尝试多个可能的地址
    if curl -f http://127.0.0.1:3000/api/health >/dev/null 2>&1 || \
       curl -f http://0.0.0.0:3000/api/health >/dev/null 2>&1 || \
       curl -f http://$(hostname -i):3000/api/health >/dev/null 2>&1; then
        echo "✅ 应用已启动"
        break
    fi
    
    echo "⏳ 等待应用启动... (${RETRY_COUNT}/${MAX_RETRIES})"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ 应用启动超时，重新启动..."
    kill $APP_PID 2>/dev/null || true
    exec $0  # 重新启动脚本
fi

# 检查环境变量是否要求自动启动调度器
AUTO_START=${AUTO_START_SCHEDULER:-all}
echo "🔍 检查自动启动策略: $AUTO_START"

if [ "$AUTO_START" = "none" ] || [ "$AUTO_START" = "disabled" ]; then
    echo "⏸️ 调度器自动启动已禁用"
else
    echo "🔄 自动启动调度器..."
    
    # 获取工作的服务器地址
    if curl -f http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
        SERVER_URL="http://127.0.0.1:3000"
    elif curl -f http://0.0.0.0:3000/api/health >/dev/null 2>&1; then
        SERVER_URL="http://0.0.0.0:3000"
    else
        SERVER_URL="http://$(hostname -i):3000"
    fi
    
    echo "🔧 使用服务器地址: $SERVER_URL"
    
    # 启动调度器
    START_RESULT=$(curl -s -X POST ${SERVER_URL}/api/scheduler \
        -H "Content-Type: application/json" \
        -d '{"action": "start"}')
    
    echo "📊 调度器启动结果: $START_RESULT"
    
    # 延迟几秒后触发首次更新
    sleep 5
    echo "🔄 触发首次热点数据更新..."
    
    UPDATE_RESULT=$(curl -s -X POST ${SERVER_URL}/api/scheduler \
        -H "Content-Type: application/json" \
        -d '{"action": "update_now"}')
    
    echo "📊 首次更新结果: $UPDATE_RESULT"
    echo "🎉 调度器初始化完成！"
fi

# 等待主进程
wait $APP_PID