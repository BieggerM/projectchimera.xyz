#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FRONTEND_SOURCE_DIR="$PROJECT_ROOT/frontend"
FRONTEND_DEST_DIR="/var/www/project-chimera-frontend"
NGINX_USER="www-data"

BACKEND_DIR="$PROJECT_ROOT/backend"
BACKEND_IMAGE_NAME="web-terminal-backend-app"
BACKEND_CONTAINER_NAME="web-terminal-server-instance"

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

echo "--- Building and Running Backend Container ---"

echo "Navigating to backend directory: $BACKEND_DIR"
cd "$BACKEND_DIR"

echo "Building Docker image: $BACKEND_IMAGE_NAME"
docker build -t "$BACKEND_IMAGE_NAME" -f Dockerfile.backend .
echo "Docker image '$BACKEND_IMAGE_NAME' built successfully."

echo "Stopping and removing any old backend container instance: $BACKEND_CONTAINER_NAME"
docker stop "$BACKEND_CONTAINER_NAME" 2>/dev/null || true
docker rm "$BACKEND_CONTAINER_NAME" 2>/dev/null || true
echo "Old backend container cleaned."

echo "Running new backend container: $BACKEND_CONTAINER_NAME"
docker run -d \
  --name "$BACKEND_CONTAINER_NAME" \
  -p 127.0.0.1:3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  "$BACKEND_IMAGE_NAME"
echo "Backend container '$BACKEND_CONTAINER_NAME' started successfully on port 3000."

echo "--- Backend Container Deployment Complete ---"
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