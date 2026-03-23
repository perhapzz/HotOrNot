# 运维手册

## 日常检查清单

### 每日
- [ ] `docker compose ps` — 所有容器 healthy
- [ ] `curl /api/health` — 应用响应正常
- [ ] 检查磁盘空间 `df -h`
- [ ] 检查 MongoDB 连接数 `db.serverStatus().connections`
- [ ] 查看错误日志 `docker compose logs --tail=50 web | grep ERROR`

### 每周
- [ ] 检查 MongoDB 数据库大小
- [ ] 检查 Redis 内存使用 `redis-cli info memory`
- [ ] 检查 SSL 证书有效期
- [ ] 检查磁盘 I/O 和 CPU 使用趋势
- [ ] 查看 Admin Dashboard 中的质量评分趋势

---

## 故障排查

### 应用无响应
```bash
# 1. 检查容器状态
docker compose ps

# 2. 查看日志
docker compose logs --tail=100 web

# 3. 重启
docker compose restart web
```

### MongoDB 连接失败
```bash
# 检查 MongoDB 是否运行
docker compose exec mongodb mongosh --eval 'db.runCommand({ping: 1})'

# 检查连接字符串
echo $MONGODB_URI

# 查看 MongoDB 日志
docker compose logs --tail=50 mongodb
```

### Redis 连接失败
```bash
# 检查 Redis
docker compose exec redis redis-cli ping
# 应返回 PONG

# 应用会自动降级到内存缓存，不会崩溃
# 查看日志确认降级
docker compose logs web | grep "Cache"
```

### 内存使用过高
```bash
# 检查容器资源
docker stats

# Redis 内存
docker compose exec redis redis-cli info memory

# 清理 Redis 缓存
docker compose exec redis redis-cli FLUSHDB
```

### 分析超时
- 检查 Gemini API Key 是否有效
- 检查 TikHub API 配额
- 查看 BullMQ 队列状态：Admin → 系统 → 队列监控
- 检查并发数：`MAX_CONCURRENCY` 默认 3

### 登录/注册失败
- 确认 `JWT_SECRET` 已设置（非默认值）
- 检查 cookie 配置（`secure` 仅在 HTTPS 下生效）
- 清除浏览器 cookie 重试

---

## 性能调优

### MongoDB
```javascript
// 确认索引存在
db.contentanalyses.getIndexes()
db.keywordanalyses.getIndexes()
db.useractivities.getIndexes()

// 添加缺失索引
db.contentanalyses.createIndex({ userId: 1, createdAt: -1 })
db.useractivities.createIndex({ userId: 1, action: 1, createdAt: -1 })
```

### Redis
```bash
# 调整最大内存（docker-compose.yml 中已设置 256MB）
# 生产环境建议 512MB-1GB
redis-cli CONFIG SET maxmemory 512mb
```

### Next.js
- 启用 `output: "standalone"` 减少镜像体积
- 配置 `images.minimumCacheTTL` 延长图片缓存
- 热榜 API 已配置 `Cache-Control: public, max-age=300`

---

## 备份恢复

### 自动备份脚本
```bash
#!/bin/bash
# /opt/hotornot/backup.sh
BACKUP_DIR="/backups/hotornot"
DATE=$(date +%Y%m%d_%H%M)

mkdir -p $BACKUP_DIR

# MongoDB
docker compose exec -T mongodb mongodump --db hotornot --archive > "$BACKUP_DIR/mongo_$DATE.archive"

# Redis
docker compose exec -T redis redis-cli BGSAVE
docker cp hotornot-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# 清理 30 天前的备份
find $BACKUP_DIR -name "*.archive" -mtime +30 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +30 -delete

echo "Backup completed: $DATE"
```

添加到 crontab：
```bash
# 每天凌晨 3 点备份
0 3 * * * /opt/hotornot/backup.sh >> /var/log/hotornot-backup.log 2>&1
```

### 恢复流程
```bash
# MongoDB
docker compose exec -T mongodb mongorestore --db hotornot --archive < /backups/hotornot/mongo_XXXXXXXX.archive

# Redis
docker cp /backups/hotornot/redis_XXXXXXXX.rdb hotornot-redis:/data/dump.rdb
docker compose restart redis
```

---

## 监控告警

### 推荐监控项
| 指标 | 告警阈值 | 说明 |
|------|----------|------|
| 应用响应时间 | > 5s | API 性能退化 |
| 错误率 | > 5% | 系统异常 |
| MongoDB 连接数 | > 80% | 连接池耗尽 |
| Redis 内存 | > 80% | 缓存即将溢出 |
| 磁盘使用 | > 85% | 存储空间不足 |
| 质量评分 | < 60 (5+ 样本) | 分析质量下降 |

### Sentry 配置
在 `.env.local` 中设置 `SENTRY_DSN` 即可自动上报错误。

### 健康检查端点
```bash
# 应用健康
GET /api/health

# 队列状态（需 admin 权限）
GET /api/admin/queues

# 定时任务状态
GET /api/admin/scheduler
```

---

## 版本更新

```bash
# 拉取最新代码
git pull origin main

# 重建镜像
docker compose build web

# 滚动更新
docker compose up -d web

# 验证
curl http://localhost:3000/api/health
```
