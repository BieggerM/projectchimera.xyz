#!/bin/bash
set -e

# Set permissions for the /home directory itself.
# chmod 701 allows users to "traverse" (cd into) subdirectories if they know the full path,
# but prevents them from listing the contents of /home itself (e.g., ls /home).
chmod 701 /home/ 

USERS=("investigator" "evans" "subject07" "sys_admin")

for USER in "${USERS[@]}"; do
    if ! id -u "$USER" &>/dev/null; then
        echo "Error: User $USER does not exist! Please create it in the Dockerfile." >&2
        exit 1
    fi
    mkdir -p "/home/${USER}/"
    # Ensure individual home directories are 700. This is crucial for privacy.
    chmod 700 "/home/${USER}/" 
done

for USER in "${USERS[@]}"; do
    if [ -d "/app-data/${USER}" ] && [ "$(ls -A /app-data/${USER})" ]; then
        cp -rp "/app-data/${USER}/." "/home/${USER}/"
    fi
    
    cp /usr/local/share/isopod/.bashrc_template "/home/${USER}/.bashrc"
    # Keep .bashrc explicitly at 644, or rely on the find command for files.
    # 644 is typical: owner r/w, group/others read-only. If you want 600, change it here.
    chmod 644 "/home/${USER}/.bashrc" 
    
    chown -R "${USER}:${USER}" "/home/${USER}/"

    # --- UPDATED PERMISSIONS HERE ---
    # Set 740 for all directories (rwxr-----)
    find "/home/${USER}/" -type d -exec chmod 740 {} + 
    # Set 640 for all files (rw-r-----)
    find "/home/${USER}/" -type f -exec chmod 640 {} + 
done

TERMINAL_USER="${USERS[0]}"

if [ $# -eq 0 ]; then
    exec su -l "${TERMINAL_USER}"
else
    exec su -l "${TERMINAL_USER}" -c "$*"
fi