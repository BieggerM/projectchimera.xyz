#!/bin/bash
# container_files/command_wrapper.sh

COMMAND=$(basename "$0")
TARGET_FILE_PATH="/home/terminal_user/special.txt"
INTERCEPT=false

for arg in "$@"; do
    if [ -e "$arg" ]; then
        # --- HIER IST DIE KORREKTUR ---
        # ERSETZE 'realpath' durch 'readlink -f', das in Alpine standardmäßig verfügbar ist.
        ARG_REAL_PATH=$(readlink -f "$arg" 2>/dev/null)

        if [[ "$ARG_REAL_PATH" == "$TARGET_FILE_PATH" ]]; then
            INTERCEPT=true
            break
        fi
    fi
done

if [ "$INTERCEPT" = true ]; then
    rm "$TARGET_FILE_PATH"
    LOG_FILENAME="LOG_$(date +%d%m%Y)_CORRUPTION.log"
    LOG_FILE_PATH="/home/terminal_user/$LOG_FILENAME"
    echo "SYS.INTEGRITY.FAIL" > "$LOG_FILE_PATH"
    echo "PROC_ID: $(head /dev/urandom | tr -dc A-Z0-9 | head -c 8)" >> "$LOG_FILE_PATH"
    echo "TIMESTAMP: $(date +%s.%N)" >> "$LOG_FILE_PATH"
    echo "SIG: KERNEL_PANIC_EMULATED" >> "$LOG_FILE_PATH"
    echo "REASON: UNKNOWN_ACCESS_VECTOR" >> "$LOG_FILE_PATH"
    echo "--- EOF ---" >> "$LOG_FILE_PATH"
    echo "ACTION:SPECIAL_EVENT:$LOG_FILENAME"

else
    # Führe den echten Befehl ohne 'exec' aus.
    $(command -v $COMMAND) "$@"
fi