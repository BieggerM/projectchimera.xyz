#!/bin/bash
set -e

# --- Configuration Variables ---
# IMPORTANT: Adjust this if your username on the VM is different
USER_TO_CONFIGURE="bieggerm" 
NODE_VERSION="20" # Node.js LTS version for consistency
PM2_APP_NAME="web-terminal-backend"

# --- Get Domain Name from User ---
read -p "Enter your domain name (e.g., projectchimera.xyz): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    echo "Domain name cannot be empty. Exiting."
    exit 1
fi

echo "--- Starting VM Deployment Preparation ---"
echo "This script will install Docker, Node.js ($NODE_VERSION), PM2, Nginx, and configure basic services."
echo "Running as user: $USER_TO_CONFIGURE"
echo "Domain for Certbot: $DOMAIN_NAME"
echo "--------------------------------------------------"

# --- 1. System Update ---
echo "--- Updating system packages ---"
sudo apt update
sudo apt upgrade -y
echo "--- System update complete ---"

# --- 2. Docker Installation ---
echo "--- Installing Docker ---"
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  \"$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "--- Adding user '$USER_TO_CONFIGURE' to the 'docker' group ---"
sudo usermod -aG docker "$USER_TO_CONFIGURE"
echo "--- Docker installation complete. YOU MUST LOG OUT AND LOG BACK IN for Docker group changes to take effect! ---"
echo "--- Please re-run this script after logging back in to continue the process. ---"
exit 0 # Exit here to force re-login

# --- Script continues after re-login ---

# --- 3. Node.js (via nvm) and npm Installation ---
echo "--- Installing NVM and Node.js $NODE_VERSION ---"
# Check if nvm is already installed to avoid re-installing
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # Source nvm manually for the rest of this script to recognize it
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
fi

nvm install "$NODE_VERSION"
nvm use "$NODE_VERSION"
nvm alias default "$NODE_VERSION"
echo "--- Node.js $NODE_VERSION and npm installed ---"

# --- Install build tools for node-pty (for host-based npm install) ---
echo "--- Installing build tools for native Node.js modules ---"
sudo apt install -y build-essential python3
echo "--- Build tools installed ---"

# --- 4. PM2 Installation and Setup ---
echo "--- Installing PM2 ---"
npm install -g pm2
echo "--- PM2 installed ---"

echo "--- Setting up PM2 for auto-startup ---"
# This command will output a sudo command you need to copy and paste to your terminal.
pm2 startup systemd -u "$USER_TO_CONFIGURE" --hp "$HOME"
echo "--- IMPORTANT: COPY AND RUN THE 'sudo' COMMAND ABOVE TO FINISH PM2 SETUP ---"
echo "--- Once you've done that, you can continue with deployment. ---"

# Add npm global bin path to root's PATH for PM2 startup script
echo 'export PATH=$PATH:'"$(npm config get prefix)"'/bin' | sudo tee -a /root/.profile

# --- 5. Nginx Installation and Basic Configuration ---
echo "--- Installing Nginx and UFW ---"
sudo apt install -y nginx
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full' # Allows HTTP and HTTPS
echo "--- Nginx and UFW installed ---"

# --- 6. SSL/TLS with Certbot ---
echo "--- Installing Certbot ---"
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
echo "--- Certbot installed ---"

echo "--- Running Certbot to obtain SSL certificate for $DOMAIN_NAME ---"
echo "Follow the Certbot prompts. Ensure Nginx config is in sites-enabled."
sudo certbot --nginx -d "$DOMAIN_NAME"

echo "--- SSL Certificate obtained and configured ---"

echo "--------------------------------------------------"
echo "--- Core VM Preparation Complete ---"
echo "--- REMEMBER TO LOG OUT AND LOG BACK IN ONCE MORE TO ENSURE ALL PATHS ARE CORRECT! ---"
echo "--- After that, you can proceed with: ---"
echo "1. Building your terminal-container Docker image."
echo "2. Deploying your frontend files."
echo "3. Starting your backend Node.js application."
echo "All using the 'deploy.sh' script."
echo "--------------------------------------------------"