#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FRONTEND_SOURCE_DIR="$PROJECT_ROOT/frontend"
FRONTEND_DEST_DIR="/var/www/project-chimera-frontend"
NGINX_USER="www-data"

BACKEND_DIR="$PROJECT_ROOT/backend"
PM2_APP_NAME="web-terminal-backend"

TERMINAL_CONTAINER_DIR="$PROJECT_ROOT/container"
TERMINAL_IMAGE_NAME="ghcr.io/bieggerm/projectchimera.xyz/terminal-container:latest"

echo "--- Starting Project Chimera Full Deployment ---"
echo "Project Root: $PROJECT_ROOT"
echo "------------------------------------------------"

echo "--- Deploying Frontend Files ---"
echo "Stopping Nginx service..."
sudo systemctl stop nginx || true
echo "Nginx stopped (if running)."

echo "Creating/ensuring frontend destination directory: $FRONTEND_DEST_DIR"
sudo mkdir -p "$FRONTEND_DEST_DIR"

echo "Copying files from $FRONTEND_SOURCE_DIR to $FRONTEND_DEST_DIR..."
sudo rsync -av --delete "$FRONTEND_SOURCE_DIR/" "$FRONTEND_DEST_DIR/"
echo "Frontend files copied."
echo "Writing WebSocket configuration..."
sudo bash -c "echo \"window.WEBSOCKET_URL = 'wss://$DOMAIN_NAME/terminal';\" > \"$FRONTEND_DEST_DIR/js/config.js\""

echo "Setting ownership to $NGINX_USER:$NGINX_USER for $FRONTEND_DEST_DIR..."
sudo chown -R "$NGINX_USER":"$NGINX_USER" "$FRONTEND_DEST_DIR"
echo "Ownership set."

echo "Setting permissions (755 for directories, 644 for files) for frontend files..."
sudo find "$FRONTEND_DEST_DIR" -type d -exec chmod 755 {} +
sudo find "$FRONTEND_DEST_DIR" -type f -exec chmod 644 {} +
echo "Frontend permissions set."

echo "--- Frontend Deployment Complete ---"
echo "------------------------------------------------"

echo "--- Building and Starting Backend Application ---"

echo "Navigating to backend directory: $BACKEND_DIR"
cd "$BACKEND_DIR"

echo "Installing Node.js dependencies..."
npm install --production
echo "Dependencies installed."

echo "Starting backend with PM2..."
pm2 restart "$PM2_APP_NAME" --update-env 2>/dev/null || \
  TERMINAL_IMAGE_NAME="$TERMINAL_IMAGE_NAME" pm2 start server.js --name "$PM2_APP_NAME"
echo "Backend running under PM2 process '$PM2_APP_NAME'."

echo "--- Backend Deployment Complete ---"
echo "------------------------------------------------"

echo "--- Pulling Terminal Container Image ---"

echo "Pulling Docker image: $TERMINAL_IMAGE_NAME"
docker pull "$TERMINAL_IMAGE_NAME"
echo "Docker image '$TERMINAL_IMAGE_NAME' pulled successfully."

echo "--- Terminal Container Image Pull Complete ---"
echo "------------------------------------------------"

echo "--- Restarting Nginx service ---"
sudo systemctl start nginx
echo "Nginx started."

echo "--- Deployment of Project Chimera Complete! ---"
echo "Access your terminal at https://$DOMAIN_NAME/"
echo "Remember to clear your browser cache (Ctrl+Shift+R / Cmd+Shift+R)."
echo "------------------------------------------------"