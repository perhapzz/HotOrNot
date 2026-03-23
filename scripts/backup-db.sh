#!/bin/bash
# MongoDB Backup Script
# Usage: ./scripts/backup-db.sh [MONGODB_URI] [BACKUP_DIR]
#
# Env vars:
#   MONGODB_URI   — Connection string (default: mongodb://localhost:27017/hotornot)
#   BACKUP_DIR    — Where to store backups (default: ./backups)
#   RETENTION_DAYS — Days to keep old backups (default: 7)
#   S3_BUCKET     — Optional: upload to S3 after backup

set -euo pipefail

MONGODB_URI="${1:-${MONGODB_URI:-mongodb://localhost:27017/hotornot}}"
BACKUP_DIR="${2:-${BACKUP_DIR:-./backups}}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M")
BACKUP_NAME="backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo "🗄️  Starting MongoDB backup..."
echo "   URI: ${MONGODB_URI%@*}@***" # Hide credentials in output
echo "   Dir: ${BACKUP_PATH}"

mkdir -p "${BACKUP_DIR}"

# Dump
mongodump --uri="${MONGODB_URI}" --out="${BACKUP_PATH}" --quiet

# Compress
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "✅ Backup complete: ${BACKUP_FILE} (${SIZE})"

# Optional S3 upload
if [ -n "${S3_BUCKET:-}" ]; then
  echo "☁️  Uploading to s3://${S3_BUCKET}/..."
  aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/${BACKUP_NAME}.tar.gz"
  echo "✅ Uploaded to S3"
fi

# Cleanup old backups
echo "🧹 Cleaning backups older than ${RETENTION_DAYS} days..."
DELETED=$(find "${BACKUP_DIR}" -name "backup-*.tar.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
echo "   Removed ${DELETED} old backup(s)"

echo "🎉 Done."
