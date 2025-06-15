#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Define the target users and groups
TERMINAL_USER="investigator"
# Assuming group name is the same as user name for chown, GID variable is not strictly needed.

TERMINAL_USER2="evans"
TERMINAL_USER3="subject07"
TERMINAL_USER4="sys_admin"
# Assuming group name is the same as user name for chown.

if ! id -u "$TERMINAL_USER" &>/dev/null; then
    echo "Error: User $TERMINAL_USER does not exist!" >&2
    exit 1
fi
if ! id -u "$TERMINAL_USER2" &>/dev/null; then
    echo "Error: User $TERMINAL_USER2 does not exist!" >&2
    exit 1
fi
if ! id -u "$TERMINAL_USER3" &>/dev/null; then
    echo "Error: User $TERMINAL_USER3 does not exist!" >&2
    exit 1
fi
if ! id -u "$TERMINAL_USER4" &>/dev/null; then
    echo "Error: User $TERMINAL_USER4 does not exist!" >&2
    exit 1
fi


mkdir -p "/home/${TERMINAL_USER}/"
mkdir -p "/home/${TERMINAL_USER2}/"
mkdir -p "/home/${TERMINAL_USER3}/"
mkdir -p "/home/${TERMINAL_USER4}/"


if [ -d "/app-data/${TERMINAL_USER}" ] && [ "$(ls -A /app-data/${TERMINAL_USER})" ]; then
    cp -rp "/app-data/${TERMINAL_USER}/." "/home/${TERMINAL_USER}/"
    chown -R "${TERMINAL_USER}:${TERMINAL_USER}" "/home/${TERMINAL_USER}/"
fi

if [ -d "/app-data/${TERMINAL_USER2}" ] && [ "$(ls -A /app-data/${TERMINAL_USER2})" ]; then
    cp -rp "/app-data/${TERMINAL_USER2}/." "/home/${TERMINAL_USER2}/"
    chown -R "${TERMINAL_USER2}:${TERMINAL_USER2}" "/home/${TERMINAL_USER2}/"
fi

if [ -d "/app-data/${TERMINAL_USER3}" ] && [ "$(ls -A /app-data/${TERMINAL_USER3})" ]; then
    cp -rp "/app-data/${TERMINAL_USER3}/." "/home/${TERMINAL_USER3}/"
    chown -R "${TERMINAL_USER3}:${TERMINAL_USER3}" "/home/${TERMINAL_USER3}/"
fi

if [ -d "/app-data/${TERMINAL_USER4}" ] && [ "$(ls -A /app-data/${TERMINAL_USER4})" ]; then
    cp -rp "/app-data/${TERMINAL_USER4}/." "/home/${TERMINAL_USER4}/"
    chown -R "${TERMINAL_USER4}:${TERMINAL_USER4}" "/home/${TERMINAL_USER4}/"
fi

# Execute the CMD (e.g., /bin/bash from Dockerfile) as the primary terminal_user
# If "$@" is empty (no command passed to `docker run`), start a login shell for TERMINAL_USER.
# If "$@" is not empty, execute the provided command as TERMINAL_USER.
if [ $# -eq 0 ]; then
    exec su - "${TERMINAL_USER}" -s /bin/bash
else
    exec su - "${TERMINAL_USER}" -c "$*" 
fi

