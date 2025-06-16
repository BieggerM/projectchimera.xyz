// server.js

const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const { exec } = require('child_process'); // Import exec

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

    const specialEventSignal = 'ACTION:SPECIAL_EVENT:';
    const glitchRebootSignal = 'ACTION:EVENTS:GLITCHEVENT';

    ptyProcess.onData(data => {
        const dataStr = data.toString(); // Ensure we're working with a string
        
        if (data.startsWith(specialEventSignal)) {
            // Log file creation event
            console.log('[SERVER] Special event triggered by container.');
            const logfileName = data.substring(specialEventSignal.length).trim();

            const commandForFrontend = {
                type: 'special_event',
                payload: {
                    logfileName: logfileName
                }
            };

            // Sende den JSON-Befehl an das Frontend.
            ws.send(JSON.stringify(commandForFrontend));
        } else if (dataStr.startsWith(glitchRebootSignal)) {
            // Immersive glitch and reboot event
            console.log('[SERVER] Glitch Reboot event triggered by container.');
            // 1. Tell frontend to start glitch sequence
            ws.send(JSON.stringify({ type: 'glitch_reboot_sequence' }));

            // 2. Use docker exec to delete the file as root
            const deleteCommandViaExec = `docker exec ${containerName} rm -f /home/evans/projects/chimera/logs/subject07.log`;
            console.log(`[SERVER] Executing via docker exec: ${deleteCommandViaExec}`);
            exec(deleteCommandViaExec, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[SERVER] Error executing docker exec for rm: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.warn(`[SERVER] Stderr from docker exec for rm: ${stderr}`);
                }
                console.log(`[SERVER] Successfully executed rm via docker exec. stdout: ${stdout}`);
            });
        } else {
            // Normale Daten, einfach weiterleiten.
            ws.send(data);
        }
    });

    ws.on('message', (message) => {
        try {
            const command = JSON.parse(message);
            if (command.type === 'resize' && command.cols && command.rows) {
                ptyProcess.resize(command.cols, command.rows);
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

