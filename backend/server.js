// server.js

const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');

const app = express();
expressWs(app);

const port = 3000;
const dockerImageName = 'terminal-container';

app.ws('/terminal', (ws, req) => {
    console.log('WebSocket connection established.');

    const ptyProcess = pty.spawn('docker', [
        'run', '--rm', '--interactive', '--tty',
        '--read-only',
        '--tmpfs', '/home/terminal_user:rw,exec,uid=1000,gid=1000',
        '--network=none', '--cpus=0.5', '--memory=128m',
        '--cap-drop=ALL', '--cap-add=SETUID',
        '--hostname', 'isopod', '--env', 'PS1=[\\u@\\h \\W]\\$ ',
        dockerImageName
    ], { name: 'xterm-color', cols: 80, rows: 30, cwd: process.env.HOME, env: process.env });

    const specialEventSignal = 'ACTION:SPECIAL_EVENT:';

    ptyProcess.onData(data => {
        // Prüfen, ob die Daten vom Container unser neues Signal sind.
        if (data.startsWith(specialEventSignal)) {
            // Signal erkannt!
            console.log('[SERVER] Special event triggered by container.');
            
            // Extrahiere den Dateinamen aus dem Signal.
            const logfileName = data.substring(specialEventSignal.length).trim();

            // Erstelle ein JSON-Objekt als Befehl für das Frontend.
            const commandForFrontend = {
                type: 'special_event',
                payload: {
                    logfileName: logfileName
                }
            };

            // Sende den JSON-Befehl an das Frontend.
            ws.send(JSON.stringify(commandForFrontend));

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