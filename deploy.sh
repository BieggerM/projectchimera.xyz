#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# --- Configuration Variables ---
# Root directory of your project (where this script is located)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Frontend paths
FRONTEND_SOURCE_DIR="$PROJECT_ROOT/frontend"
FRONTEND_DEST_DIR="/var/www/project-chimera-frontend"
NGINX_USER="www-data"

# Backend container paths and names
BACKEND_DIR="$PROJECT_ROOT/backend"
BACKEND_IMAGE_NAME="web-terminal-backend-app" # A new, specific name for the backend image
BACKEND_CONTAINER_NAME="web-terminal-server-instance" # Name for the running backend container

# Terminal container image paths and names
TERMINAL_CONTAINER_DIR="$PROJECT_ROOT/container"
TERMINAL_IMAGE_NAME="terminal-container" # Name of the terminal image

echo "--- Starting Project Chimera Full Deployment ---"
echo "Project Root: $PROJECT_ROOT"
echo "------------------------------------------------"

# --- 1. Deploy Frontend Files ---
echo "--- Deploying Frontend Files ---"

# Stop Nginx during file copy for consistency (optional, but good practice)
echo "Stopping Nginx service..."
sudo systemctl stop nginx || true # '|| true' prevents script from exiting if nginx is not running
echo "Nginx stopped (if running)."

# Create destination directory if it doesn't exist
echo "Creating/ensuring frontend destination directory: $FRONTEND_DEST_DIR"
sudo mkdir -p "$FRONTEND_DEST_DIR"

# Copy frontend files using rsync for efficiency and robustness
# -a: archive mode (preserves permissions, timestamps, etc.)
# -v: verbose
# --delete: delete files in DEST_DIR that are not in SOURCE_DIR
echo "Copying files from $FRONTEND_SOURCE_DIR to $FRONTEND_DEST_DIR..."
sudo rsync -av --delete "$FRONTEND_SOURCE_DIR/" "$FRONTEND_DEST_DIR/"
echo "Frontend files copied."

# Set correct ownership for Nginx
echo "Setting ownership to $NGINX_USER:$NGINX_USER for $FRONTEND_DEST_DIR..."
sudo chown -R "$NGINX_USER":"$NGINX_USER" "$FRONTEND_DEST_DIR"
echo "Ownership set."

# Set permissions: 755 for directories, 644 for files
echo "Setting permissions (755 for directories, 644 for files) for frontend files..."
sudo find "$FRONTEND_DEST_DIR" -type d -exec chmod 755 {} +
sudo find "$FRONTEND_DEST_DIR" -type f -exec chmod 644 {} +
echo "Frontend permissions set."

echo "--- Frontend Deployment Complete ---"
echo "------------------------------------------------"

# --- 2. Build and Run Backend Container ---
echo "--- Building and Running Backend Container ---"

# Navigate to backend directory to build the image
echo "Navigating to backend directory: $BACKEND_DIR"
cd "$BACKEND_DIR"

# Build backend Docker image
# Assuming your Dockerfile for the backend is named 'Dockerfile.backend' in this directory
echo "Building Docker image: $BACKEND_IMAGE_NAME"
docker build -t "$BACKEND_IMAGE_NAME" -f Dockerfile.backend .
echo "Docker image '$BACKEND_IMAGE_NAME' built successfully."

# Stop and remove any old backend container instance
echo "Stopping and removing any old backend container instance: $BACKEND_CONTAINER_NAME"
docker stop "$BACKEND_CONTAINER_NAME" 2>/dev/null || true # Stop if running
docker rm "$BACKEND_CONTAINER_NAME" 2>/dev/null || true # Remove if stopped
echo "Old backend container cleaned."

# Run the new backend container
# Mount /var/run/docker.sock to allow it to spawn other Docker containers
echo "Running new backend container: $BACKEND_CONTAINER_NAME"
docker run -d \
  --name "$BACKEND_CONTAINER_NAME" \
  -p 127.0.0.1:3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  "$BACKEND_IMAGE_NAME"
echo "Backend container '$BACKEND_CONTAINER_NAME' started successfully on port 3000."

echo "--- Backend Container Deployment Complete ---"
echo "------------------------------------------------"

# --- 3. Build Terminal Container Image ---
echo "--- Building Terminal Container Image ---"

# Navigate to terminal container directory to build the image
echo "Navigating to terminal container directory: $TERMINAL_CONTAINER_DIR"
cd "$TERMINAL_CONTAINER_DIR"

# Build the terminal container Docker image
# Assuming your Dockerfile for the terminal image is named 'Dockerfile' in this directory
echo "Building Docker image: $TERMINAL_IMAGE_NAME"
docker build -t "$TERMINAL_IMAGE_NAME" .
echo "Docker image '$TERMINAL_IMAGE_NAME' built successfully."

echo "--- Terminal Container Image Build Complete ---"
echo "------------------------------------------------"

# --- 4. Restart Nginx ---
echo "--- Restarting Nginx service ---"
sudo systemctl start nginx
echo "Nginx started."

echo "--- Deployment of Project Chimera Complete! ---"
echo "Access your terminal at https://$DOMAIN_NAME/"
echo "Remember to clear your browser cache (Ctrl+Shift+R / Cmd+Shift+R)."
echo "------------------------------------------------"