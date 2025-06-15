#!/bin/bash

# Define the target users and groups
TERMINAL_USER="terminal_user"
TERMINAL_USER_GID="terminal_user" 

TERMINAL_USER2="terminal_user2"
TERMINAL_USER2_GID="terminal_user2" 

if ! id -u "$TERMINAL_USER" &>/dev/null; then
    exit 1
fi
if ! id -u "$TERMINAL_USER2" &>/dev/null; then
    exit 1
fi

mkdir -p /home/terminal_user/
mkdir -p /home/terminal_user2/

cp -r /app-data/terminal_user_files/* /home/terminal_user/
chown -R "$TERMINAL_USER":"$TERMINAL_USER_GID" /home/terminal_user/

cp -r /app-data/terminal_user2_files/ /home/terminal_user2/
chown -R "$TERMINAL_USER2":"$TERMINAL_USER2_GID" /home/terminal_user2/

exec "$@"
