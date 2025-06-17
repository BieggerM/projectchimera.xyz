// server.js

const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const { exec } = require('child_process'); // Import exec
const WebSocket = require('ws');

const app = express();
expressWs(app);

const port = 3000;
const dockerImageName = 'terminal-container';

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
        const dataStr = data.toString(); // Ensure we're working with a string
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
                    //console.log("Received ping, sent pong."); // For debugging
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
    console.log(`Build the terminal image first with: docker build -t ${dockerImageName} ../`);
});

function handleGlitchEvent(ws, containerName) {
    console.log('[SERVER] Glitch Reboot event triggered by container.');
    ws.send(JSON.stringify({ type: 'glitch_reboot_sequence' }));
    try {
        console.log(`[SERVER] Executing via docker exec glitch routine`);
        const deleteSubject07log = `rm -f /home/evance/projects/chimera/logs/subject07.log`;
        executeDockerCommand(containerName, "root", deleteSubject07log);
        const copyZukunftFile = `cp /var/archive/.zukunft /home/evance/`;
        executeDockerCommand(containerName, "evance", copyZukunftFile);
        const copyKernelLog = `cp /var/archive/kernel_panic.log /home/evance/`;
        executeDockerCommand(containerName, "root", copyKernelLog);
    } catch (error) {
        console.log(error);
    }
}

/**
 * Führt einen Befehl innerhalb eines Docker-Containers als spezifischen Benutzer aus.
 * @param {string} containerName Der Name oder die ID des Docker-Containers.
 * @param {string} username Der Benutzername, unter dem der Befehl ausgeführt werden soll (z.B. 'root' oder 'investigator').
 * @param {string} command Der auszuführende Befehl (z.B. 'ls -l /var/log/').
 * @returns {Promise<{stdout: string, stderr: string}>} Eine Promise, die mit stdout und stderr aufgelöst wird, oder bei Fehler abgelehnt wird.
 */
function executeDockerCommand(containerName, username, command) {
    return new Promise((resolve, reject) => {
        // Optionale Ergänzung: Überprüfen, ob Username gültig ist (einfache Prüfung)
        if (!username || typeof username !== 'string') {
            console.error("[SERVER] Invalid username provided for docker exec.");
            return reject(new Error("Invalid username for docker exec."));
        }

        // Konstruiere den vollen Docker-Befehl mit dem -u Flag
        const fullCommand = `docker exec -u ${username} ${containerName} ${command}`;
        console.log(`[SERVER] Executing via docker exec: ${fullCommand}`); // Logging für Sichtbarkeit

        exec(fullCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`[SERVER] Error executing docker exec command '${command}' as user '${username}': ${error.message}`);
                if (stderr) {
                    console.warn(`[SERVER] Stderr from docker exec: ${stderr}`);
                }
                reject({ error, stdout, stderr });
            } else {
                console.log(`[SERVER] Successfully executed via docker exec. stdout: ${stdout.trim()}`);
                // Gib stderr auch bei Erfolg aus, falls es Warnungen enthält
                if (stderr) {
                    console.warn(`[SERVER] Stderr from docker exec (warnings): ${stderr.trim()}`);
                }
                // Löse die Promise mit stdout und stderr auf
                resolve({ stdout, stderr });
            }
        });
    });
}


