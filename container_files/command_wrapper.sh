#!/bin/bash
# container_files/command_wrapper.sh

COMMAND=$(basename "$0")
TARGET_FILE_PATH="/home/terminal_user/special.txt"
INTERCEPT=false

for arg in "$@"; do
    if [ -e "$arg" ]; then
        ARG_REAL_PATH=$(realpath "$arg" 2>/dev/null)
        if [[ "$ARG_REAL_PATH" == "$TARGET_FILE_PATH" ]]; then
            INTERCEPT=true
            break
        fi
    fi
done

if [ "$INTERCEPT" = true ]; then
    # --- AKTION! ---
    
    # 1. Alte Datei löschen.
    rm "$TARGET_FILE_PATH"

    # 2. Namen für die neue Log-Datei generieren.
    LOG_FILENAME="LOG_$(date +%d%m%Y)_CORRUPTION.log"
    LOG_FILE_PATH="/home/terminal_user/$LOG_FILENAME"

    # 3. Kryptischen Inhalt für die Log-Datei erstellen.
    echo "SYS.INTEGRITY.FAIL" > "$LOG_FILE_PATH"
    echo "PROC_ID: $(head /dev/urandom | tr -dc A-Z0-9 | head -c 8)" >> "$LOG_FILE_PATH"
    echo "TIMESTAMP: $(date +%s.%N)" >> "$LOG_FILE_PATH"
    echo "SIG: KERNEL_PANIC_EMULATED" >> "$LOG_FILE_PATH"
    echo "REASON: UNKNOWN_ACCESS_VECTOR" >> "$LOG_FILE_PATH"
    echo "--- EOF ---" >> "$LOG_FILE_PATH"

    # 4. Sende ein eindeutiges Signal mit dem neuen Dateinamen an den Server.
    # Wichtig: Es wird kein "I SEE YOU" mehr gesendet.
    echo "ACTION:SPECIAL_EVENT:$LOG_FILENAME"

else
    # Normales Verhalten: Führe den echten Befehl aus.
    exec $(command -v $COMMAND) "$@"
fi