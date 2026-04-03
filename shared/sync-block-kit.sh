#!/usr/bin/env bash
# sync-block-kit.sh — Generate 4 venue-specific Slack Block Kit files
# from the single canonical template.
#
# Usage: bash shared/sync-block-kit.sh   (from SHIFT REPORTS 3.0 root)
#    or: bash sync-block-kit.sh           (from shared/ directory)
#
# Idempotent — safe to run multiple times.

set -euo pipefail

# Resolve paths relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATE="$SCRIPT_DIR/SlackBlockKit.template.gs"

if [ ! -f "$TEMPLATE" ]; then
  echo "ERROR: Template not found at $TEMPLATE" >&2
  exit 1
fi

# ── Configuration ────────────────────────────────────────────────────
# Each entry: output_path | venue_name | error_webhook_key | warehouse_id_key
TARGETS=(
  "SAKURA HOUSE/SHIFT REPORT SCRIPTS/SlackBlockKitSakuraSR.gs|SAKURA|SAKURA_SLACK_WEBHOOK_TEST|SAKURA_DATA_WAREHOUSE_ID"
  "SAKURA HOUSE/TASK MANAGEMENT SCRIPTS/SlackBlockKitSAKURA.gs|SAKURA|SAKURA_SLACK_WEBHOOK_TEST|SAKURA_DATA_WAREHOUSE_ID"
  "THE WARATAH/SHIFT REPORT SCRIPTS/SlackBlockKitWaratahSR.js|WARATAH|WARATAH_SLACK_WEBHOOK_TEST|WARATAH_DATA_WAREHOUSE_ID"
  "THE WARATAH/TASK MANAGEMENT SCRIPTS/SlackBlockKitWaratah.gs|WARATAH|WARATAH_SLACK_WEBHOOK_TEST|WARATAH_DATA_WAREHOUSE_ID"
)

# ── Generate each file ──────────────────────────────────────────────
for entry in "${TARGETS[@]}"; do
  IFS='|' read -r rel_path venue_name webhook_key warehouse_key <<< "$entry"
  out_path="$ROOT_DIR/$rel_path"

  # Ensure target directory exists
  mkdir -p "$(dirname "$out_path")"

  # Replace placeholders
  sed \
    -e "s/__VENUE_NAME__/${venue_name}/g" \
    -e "s/__ERROR_WEBHOOK_KEY__/${webhook_key}/g" \
    -e "s/__WAREHOUSE_ID_KEY__/${warehouse_key}/g" \
    "$TEMPLATE" > "$out_path"

  echo "  Generated: $rel_path"
done

echo ""
echo "Done — 4 files generated from SlackBlockKit.template.gs"
