#!/bin/bash
set -e

chmod 755 /home/ 

USERS=("investigator" "evance" "subject07" "sys_admin")

for USER in "${USERS[@]}"; do
    if ! id -u "$USER" &>/dev/null; then
        echo "Error: User $USER does not exist! Please create it in the Dockerfile." >&2
        exit 1
    fi
    mkdir -p "/home/${USER}/"
    chmod 700 "/home/${USER}/" 
done

for USER in "${USERS[@]}"; do
    if [ -d "/app-data/${USER}" ] && [ "$(ls -A /app-data/${USER})" ]; then
        cp -rp "/app-data/${USER}/." "/home/${USER}/"
    fi
        
    chown -R "${USER}:${USER}" "/home/${USER}/"

    find "/home/${USER}/" -type d -exec chmod 740 {} + 
    find "/home/${USER}/" -type f -exec chmod 640 {} + 
done

# Workaround for motd
cp /usr/local/share/isopod/.bashrc_template "/home/investigator/.bashrc"
chmod 644 "/home/investigator/.bashrc" && chown investigator:investigator "/home/investigator/.bashrc"


TERMINAL_USER="${USERS[0]}"
if [ $# -eq 0 ]; then
    exec su -l "${TERMINAL_USER}"
else
    exec su -l "${TERMINAL_USER}" -c "$*"
fi