// server.js

const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const os = require('os');

const app = express();
expressWs(app);

const port = 3000;
const dockerImageName = 'terminal-container';

app.ws('/terminal', (ws, req) => {
    console.log('WebSocket connection established.');

    const ptyProcess = pty.spawn('docker', [
        'run', '--rm', '--interactive', '--tty',
        '--read-only',
        '--tmpfs', '/home/terminal_user:rw,exec',
        '--network=none',
        '--cpus=0.5',
        '--memory=128m',
        '--cap-drop=ALL',
        
        // --- NEW LINES START HERE ---
        '--hostname', 'isopod', // 1. Set a static, custom hostname for the container.
        '--env', 'PS1=[\\u@\\h \\W]\\$ ', // 2. Set the bash prompt format.
        // --- NEW LINES END HERE ---

        dockerImageName
    ], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });

    ptyProcess.onData(data => {
        ws.send(data);
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