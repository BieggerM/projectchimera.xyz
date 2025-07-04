// server.js

const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const { exec } = require('child_process');
const WebSocket = require('ws');

const app = express();
expressWs(app);

const port = 3000;
// Use the GHCR image by default, but allow override via environment variable
const dockerImageName = process.env.TERMINAL_IMAGE_NAME ||
    'ghcr.io/bieggerm/projectchimera.xyz/terminal-container:latest';

// Pull the latest image on startup to ensure we have the most recent version
exec(`docker pull ${dockerImageName}`, (err, stdout, stderr) => {
    if (err) {
        console.error(`[SERVER] Failed to pull Docker image ${dockerImageName}: ${err.message}`);
        if (stderr) console.error(stderr);
    } else {
        console.log(`[SERVER] Pulled Docker image ${dockerImageName}`);
    }
});

app.ws('/terminal', (ws, req) => {
    console.log('WebSocket connection established.');
    
    // Generate a unique name for the container for this session
    const containerName = `isopod-terminal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const dockerRunArgs = [
        'run', '--rm', '--interactive', '--tty',
        `--name=${containerName}`,
        '--read-only',
        '--tmpfs', '/home/:rw,exec',
        '--network=none', '--cpus=0.5', '--memory=128m',
        '--cap-drop=ALL', '--cap-add=SETUID', '--cap-add=SETGID', '--cap-add=CHOWN', '--cap-add=FOWNER',
        '--cap-add=DAC_OVERRIDE', '--cap-add=DAC_READ_SEARCH',
        '--hostname', 'CHIM-ALPHA',
        dockerImageName,
        'bash' 
    ];

    const ptyProcess = pty.spawn('docker', dockerRunArgs, { 
        name: 'xterm-color', 
        cols: 80, 
        rows: 30, 
        cwd: process.env.HOME, 
        env: process.env 
    });

    const glitchRebootSignal = 'ACTION:EVENTS:GLITCHEVENT';
    const endgameSignal = 'ACTION:EVENTS:ENDGAME';

    ptyProcess.onData(data => {
        const dataStr = data.toString();
        if (dataStr.includes(glitchRebootSignal)) {
            handleGlitchEvent(ws, containerName);
        } else if (dataStr.includes(endgameSignal)) {
            console.log('[SERVER] Game complete event triggered by container.');
            ws.send(JSON.stringify({ type: 'game_complete' }));                
        } else {
            ws.send(data);
        }
    });

    ws.on('message', (message) => {
        try {
            const command = JSON.parse(message);
            if (command.type === 'resize' && command.cols && command.rows) {
                ptyProcess.resize(command.cols, command.rows);
            } else if (command.type === 'ping') { 
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'pong' }));
                }
            } else {
                ptyProcess.write(message);
            } 
        } catch (e) {
            ptyProcess.write(message);
        }
    });

    ws.on('close', () => {
        ptyProcess.kill();
        console.log('WebSocket connection closed and container terminated.');
    });
});

app.listen(port, () => {
    console.log(`Web Terminal server listening at http://192.168.0.99:${port}`);
    console.log(`Using terminal image: ${dockerImageName}`);
});

async function handleGlitchEvent(ws, containerName) {
    console.log('[SERVER] Glitch Reboot event triggered by container.');
    ws.send(JSON.stringify({ type: 'glitch_reboot_sequence' }));
    try {
        console.log(`[SERVER] Executing via docker exec glitch routine`);
        const deleteSubject07log = `rm -f /home/evance/projects/chimera/logs/subject07.log`;
        await executeDockerCommand(containerName, "root", deleteSubject07log);
        const copyZukunftFile = `cp /var/archive/.zukunft /home/evance/`;
        await executeDockerCommand(containerName, "root", copyZukunftFile);
        const copyKernelLog = `cp /var/archive/kernel_panic.log /home/evance/`;
        await executeDockerCommand(containerName, "root", copyKernelLog);
        const chownZukunftFile = `chown evance:evance /home/evance/.zukunft`;
        await executeDockerCommand(containerName, "root", chownZukunftFile);
        const chownKernelLog = `chown evance:evance /home/evance/kernel_panic.log`;
        await executeDockerCommand(containerName, "root", chownKernelLog);
    } catch (error) {
        console.log(error);
    }
}

/**
 * 
 * @param {string} containerName 
 * @param {string} username 
 * @param {string} command 
 * @returns {Promise<{stdout: string, stderr: string}>} 
 */
function executeDockerCommand(containerName, username, command) {
    return new Promise((resolve, reject) => {
        if (!username || typeof username !== 'string') {
            console.error("[SERVER] Invalid username provided for docker exec.");
            return reject(new Error("Invalid username for docker exec."));
        }

        const fullCommand = `docker exec -u ${username} ${containerName} ${command}`;
        console.log(`[SERVER] Executing via docker exec: ${fullCommand}`); 

        exec(fullCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`[SERVER] Error executing docker exec command '${command}' as user '${username}': ${error.message}`);
                if (stderr) {
                    console.warn(`[SERVER] Stderr from docker exec: ${stderr}`);
                }
                reject({ error, stdout, stderr });
            } else {
                console.log(`[SERVER] Successfully executed via docker exec. stdout: ${stdout.trim()}`);
                if (stderr) {
                    console.warn(`[SERVER] Stderr from docker exec (warnings): ${stderr.trim()}`);
                }
                resolve({ stdout, stderr });
            }
        });
    });
}


