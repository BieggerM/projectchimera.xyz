const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');


const app = express();
expressWs(app); 

const port = 3000;
const dockerImageName = 'terminal-container'; 

app.ws('/terminal', (ws, req) => {
    console.log('WebSocket-Verbindung hergestellt.');
    const ptyProcess = pty.spawn('docker', [
        'run',
        '--rm',
        '--interactive',
        '--tty',
        '--read-only',
        '--network=none',
        '--cpus=0.5',
        '--memory=128m',
        '--cap-drop=ALL',
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

    ws.on('message', message => {
        ptyProcess.write(message);
    });

    ws.on('close', () => {
        ptyProcess.kill();
        console.log('WebSocket-Verbindung geschlossen und Container beendet.');
    });
});

// --- Serverstart ---
app.listen(port, () => {
    console.log(`Web-Terminal-Server lauscht auf http://192.168.0.99:${port}`);
    console.log(`Baue zuerst das Terminal-Image mit: docker build -t ${dockerImageName} ../`);
});