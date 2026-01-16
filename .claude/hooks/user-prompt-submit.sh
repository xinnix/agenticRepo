#!/bin/bash
# Hook: user-prompt-submit
# Description: Runs when user submits a prompt
# Environment: USER_PROMPT is available

# Log prompts for debugging and context tracking
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/prompts.log"

# Append timestamp and prompt to log file
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG_FILE"
echo "$USER_PROMPT" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Keep log file size manageable (max 1000 lines)
if [ $(wc -l < "$LOG_FILE") -gt 1000 ]; then
  tail -n 1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

exit 0
