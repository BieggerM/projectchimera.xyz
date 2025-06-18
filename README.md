# Project Chimera: Secure Access Terminal

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x%20LTS-green?style=for-the-badge&logo=nodedotjs" alt="Node.js Version">
  <img src="https://img.shields.io/badge/Docker-Engine-blue?style=for-the-badge&logo=docker" alt="Docker Engine">
  <img src="https://img.shields.io/badge/Xterm.js-5.x-lightgrey?style=for-the-badge&logo=xterm" alt="Xterm.js">
  <img src="https://img.shields.io/badge/Nginx-Webserver-green?style=for-the-badge&logo=nginx" alt="Nginx">
  <img src="https://img.shields.io/badge/Certbot-HTTPS-brightgreen?style=for-the-badge&logo=letsencrypt" alt="Certbot">
  <img src="https://img.shields.io/badge/Ubuntu-24.04%20LTS-orange?style=for-the-badge&logo=ubuntu" alt="Ubuntu LTS">
</p>

---

## 🚀 Introduction

Project Chimera is an **immersive, game-like web terminal** operating within a fully functional Unix environment. My goal was to create a unique narrative that unfolds directly through shell commands. As an Investigator, you'll navigate a Filesystem, encountering critical anomalies via a real Bash shell on an isolated Alpine Linux instance.

The Game is not very good. But the time I spent building it was. 

---

## ✨ Features

* **Authentic Terminal:** `xterm.js` provides full-featured terminal emulation.
* **Isolated Sessions:** Each connection spawns a new, disposable **Docker container** for user isolation.
* **Interactive Narrative:** In-game actions (e.g., file interactions) trigger frontend animations and backend events.
* **Customization:** Personalized MOTD, prompt, and custom `less`/`vi` wrappers for game integration.
* **Secure Environment:** Strict Docker container limits (`--read-only`, `--tmpfs /home`, `--network=none`), hardened permissions (`700`, `740`, `640`), and isolated user accounts.
* **Robust Logging (Optional):** Designed with an option for logging user inputs into an SQLite database (currently disabled).
* **Game Complete Screen:** An animated end screen signals successful completion.

---

## ⚙️ Technical Stack

* **Frontend:** HTML, CSS, JavaScript, **`xterm.js`**.
* **Backend:** **Node.js (v20 LTS)**, Express.js, `express-ws`, **`node-pty`** (PTY management).
* **Containerization:** **Docker Engine** (Alpine Linux base for terminal containers).

* **Web Server/Proxy:** **Nginx** (SSL/TLS via Certbot).
* **Process Management:** **PM2**.
* **Operating System:** Ubuntu 24.04 LTS VM.

---

## 🏗️ Architecture Overview

The project uses a client-server architecture with Docker providing isolation:

1.  **Client (Browser):** Loads static frontend from Nginx. Establishes a `wss://` WebSocket connection to Nginx.
2.  **Nginx (Reverse Proxy):** Serves frontend static files. Proxies WebSocket connections (`/` path) to the Node.js backend. Handles HTTPS.
3.  **Node.js Backend (`server.js`):** Runs on the host VM (managed by PM2). Spawns and manages unique `terminal-container` Docker instances for each WebSocket session. Orchestrates game events by monitoring container output and executing `docker exec` commands for in-game actions.
4.  **Terminal Container:** An isolated Alpine Linux Docker image with a Bash shell. Its `entrypoint.sh` sets up the user environment and custom command wrappers.

---

## 🚀 Getting Started

This guide assumes a fresh **Ubuntu 24.04 LTS VM** with SSH access and your project cloned to `/home/youruser/project-chimera`.

### 📋 Prerequisites

* `sudo` access.
* A non-root user account
* A domain name pointing to your VM's public IPv4.

### 📦 Deployment Steps

1.  **Run VM Preparation Script:** Installs Docker, Node.js, PM2, Nginx, Certbot.

    ```bash
    cd /home/$USER/project-chimera
    chmod +x deploy_prep.sh
    ./deploy_prep.sh
    # Follow prompts (domain name).
    # Crucial: Log out/in, then run ./deploy_prep.sh again to complete.
    ```

2.  **Perform Full Project Deployment:** Copies frontend, pulls the latest container images, and starts the backend.

    ```bash
    chmod +x deploy.sh
    # Set your domain name as an environment variable before running
    export DOMAIN_NAME="projectchimera.xyz" 
    sudo ./deploy.sh
    ```

### 🧪 Verification

* Access `https://yourdomain.com/` in your browser.
* Check `pm2 status`, `pm2 logs web-terminal-backend`, `sudo systemctl status nginx` on your VM for errors.
* Verify firewall rules (`sudo ufw status verbose`).

---

## 🎮 Usage

Navigate to `https://projectchimera.xyz/` in your web browser. Interact with the terminal using standard Unix commands to progress through the game's narrative.

---

## 🔧 Customization

* **Game Logic:** Modify `backend/server.js` (`ptyProcess.onData`).
* **Terminal Environment:** Adjust `container/Dockerfile` and `container/entrypoint.sh`.
* **MOTD:** Edit `container/your_motd_file.txt`.
* **UI/Animations:** Modify `frontend/js/animations.js`, `frontend/main.js`, `frontend/index.html` CSS.

---

## 🛡️ Security Considerations

Project Chimera prioritizes security through Docker's isolation: ephemeral, read-only containers, `tmpfs` for home directories, network isolation, dropped Linux capabilities, and hardened file permissions. While the Node.js backend requires Docker daemon access, user interactions are strictly confined to their individual sandboxes.

---

## 📄 License

MIT License
