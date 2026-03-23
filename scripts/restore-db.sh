#!/bin/bash
# MongoDB Restore Script
# Usage: ./scripts/restore-db.sh <backup-file.tar.gz> [MONGODB_URI]
#
# Example:
#   ./scripts/restore-db.sh ./backups/backup-2026-03-23-1500.tar.gz

set -euo pipefail

BACKUP_FILE="${1:?Usage: restore-db.sh <backup-file.tar.gz> [MONGODB_URI]}"
MONGODB_URI="${2:-${MONGODB_URI:-mongodb://localhost:27017/hotornot}}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ File not found: ${BACKUP_FILE}"
  exit 1
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf ${TMPDIR}' EXIT

echo "🗄️  Restoring MongoDB from: ${BACKUP_FILE}"
echo "   URI: ${MONGODB_URI%@*}@***"

# Extract
tar -xzf "${BACKUP_FILE}" -C "${TMPDIR}"

# Find the dump directory
DUMP_DIR=$(find "${TMPDIR}" -maxdepth 1 -type d -name "backup-*" | head -1)
if [ -z "${DUMP_DIR}" ]; then
  DUMP_DIR="${TMPDIR}"
fi

echo "⚠️  This will OVERWRITE existing data. Press Ctrl+C to abort (5s)..."
sleep 5

# Restore
mongorestore --uri="${MONGODB_URI}" --drop "${DUMP_DIR}" --quiet

echo "✅ Restore complete."
