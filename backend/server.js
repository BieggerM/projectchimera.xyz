// server.js

const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const { exec } = require('child_process');
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const app = express();
expressWs(app);

const port = 3000;
const dockerImageName = process.env.TERMINAL_IMAGE_NAME ||
    'ghcr.io/bieggerm/projectchimera.xyz/terminal-container:latest';

const mongoUri = process.env.MONGO_URI;
const mongoDbName = process.env.MONGO_DB_NAME || 'projectchimera';
const mongoCollectionName = process.env.MONGO_COLLECTION || 'sessions';

let mongoClient;
let sessionsCollection;
const mongoReadyPromise = initializeMongo();

async function initializeMongo() {
    if (!mongoUri) {
        console.warn('[SERVER] MONGO_URI not set. Session logging disabled.');
        return;
    }

    mongoClient = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 5000
    });

    try {
        await mongoClient.connect();
        const db = mongoClient.db(mongoDbName);
        sessionsCollection = db.collection(mongoCollectionName);
        console.log(`[SERVER] Connected to MongoDB at ${mongoDbName}.${mongoCollectionName}`);
    } catch (error) {
        console.error(`[SERVER] Failed to connect to MongoDB: ${error.message}`);
        sessionsCollection = undefined;
    }
}

function gracefullyCloseMongo() {
    if (!mongoClient) {
        return Promise.resolve();
    }

    return mongoClient.close().catch(error => {
        console.error(`[SERVER] Error closing MongoDB client: ${error.message}`);
    });
}

process.on('SIGINT', async () => {
    await gracefullyCloseMongo();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await gracefullyCloseMongo();
    process.exit(0);
});

exec(`docker pull ${dockerImageName}`, (err, stdout, stderr) => {
    if (err) {
        console.error(`[SERVER] Failed to pull Docker image ${dockerImageName}: ${err.message}`);
        if (stderr) console.error(stderr);
    } else {
        console.log(`[SERVER] Pulled Docker image ${dockerImageName}`);
    }
});

app.ws('/terminal', async (ws, req) => {
    console.log('WebSocket connection established.');

    await mongoReadyPromise;

    const containerName = `isopod-terminal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sessionId = crypto.randomUUID();
    let sessionActive = false;
    let commandBuffer = '';

    async function logSessionEvent(event) {
        if (!sessionsCollection || !sessionActive) {
            return;
        }

        try {
            await sessionsCollection.updateOne(
                { _id: sessionId },
                { $push: { events: { ...event, timestamp: new Date() } } }
            );
        } catch (error) {
            console.error(`[SERVER] Failed to log event for session ${sessionId}: ${error.message}`);
        }
    }

    if (sessionsCollection) {
        try {
            await sessionsCollection.insertOne({
                _id: sessionId,
                containerName,
                startedAt: new Date(),
                remoteAddress: req.socket.remoteAddress,
                events: []
            });
            sessionActive = true;
            await logSessionEvent({ type: 'session_started' });
        } catch (error) {
            console.error(`[SERVER] Failed to insert session ${sessionId}: ${error.message}`);
        }
    }

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

    ptyProcess.onData(async data => {
        const dataStr = data.toString();
        if (dataStr.includes(glitchRebootSignal)) {
            await logSessionEvent({ type: 'glitch_signal_detected' });
            handleGlitchEvent(ws, containerName, logSessionEvent).catch(error => {
                console.error(`[SERVER] Error handling glitch event: ${error.message}`);
            });
        } else if (dataStr.includes(endgameSignal)) {
            console.log('[SERVER] Game complete event triggered by container.');
            ws.send(JSON.stringify({ type: 'game_complete' }));
            await logSessionEvent({ type: 'game_complete_signal' });
        } else {
            ws.send(data);
        }

        if (dataStr.trim().length > 0) {
            logSessionEvent({ type: 'output', payload: dataStr });
        }
    });

    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);
            if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
                ptyProcess.resize(parsed.cols, parsed.rows);
                logSessionEvent({ type: 'resize', cols: parsed.cols, rows: parsed.rows });
            } else if (parsed.type === 'ping') {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'pong' }));
                }
            } else {
                ptyProcess.write(message);
            }
            return;
        } catch (error) {
            // Not JSON, treat as command data
        }

        const inputData = message.toString();
        commandBuffer += inputData;

        if (/\r\n|[\r\n]/.test(commandBuffer)) {
            const segments = commandBuffer.split(/\r\n|[\r\n]/);
            commandBuffer = segments.pop();
            segments.forEach(segment => {
                const snapshot = toPrintableCommand(segment);
                if (snapshot.length === 0) {
                    return;
                }
                logSessionEvent({
                    type: 'command',
                    raw: segment,
                    command: snapshot
                });
            });
        }

        ptyProcess.write(message);
    });

    ws.on('close', async () => {
        ptyProcess.kill();
        console.log('WebSocket connection closed and container terminated.');
        if (sessionActive && sessionsCollection) {
            try {
                await sessionsCollection.updateOne(
                    { _id: sessionId },
                    {
                        $set: { endedAt: new Date() },
                        $push: { events: { type: 'session_closed', timestamp: new Date() } }
                    }
                );
            } catch (error) {
                console.error(`[SERVER] Failed to finalize session ${sessionId}: ${error.message}`);
            }
        }
    });
});

app.listen(port, () => {
    console.log(`Web Terminal server listening at http://192.168.0.99:${port}`);
    console.log(`Using terminal image: ${dockerImageName}`);
});

async function handleGlitchEvent(ws, containerName, logSessionEvent) {
    console.log('[SERVER] Glitch Reboot event triggered by container.');
    if (typeof logSessionEvent === 'function') {
        logSessionEvent({ type: 'glitch_sequence_started' });
    }
    ws.send(JSON.stringify({ type: 'glitch_reboot_sequence' }));
    try {
        console.log('[SERVER] Executing via docker exec glitch routine');
        const deleteSubject07log = 'rm -f /home/evance/projects/chimera/logs/subject07.log';
        await executeDockerCommand(containerName, 'root', deleteSubject07log);
        const copyZukunftFile = 'cp /var/archive/.zukunft /home/evance/';
        await executeDockerCommand(containerName, 'root', copyZukunftFile);
        const copyKernelLog = 'cp /var/archive/kernel_panic.log /home/evance/';
        await executeDockerCommand(containerName, 'root', copyKernelLog);
        const chownZukunftFile = 'chown evance:evance /home/evance/.zukunft';
        await executeDockerCommand(containerName, 'root', chownZukunftFile);
        const chownKernelLog = 'chown evance:evance /home/evance/kernel_panic.log';
        await executeDockerCommand(containerName, 'root', chownKernelLog);
        if (typeof logSessionEvent === 'function') {
            logSessionEvent({ type: 'glitch_sequence_completed' });
        }
    } catch (error) {
        console.log(error);
        if (typeof logSessionEvent === 'function') {
            logSessionEvent({ type: 'glitch_sequence_error', error: error.message });
        }
    }
}

function toPrintableCommand(rawInput) {
    let buffer = '';

    for (const char of rawInput) {
        const code = char.charCodeAt(0);
        if (code === 8 || code === 127) {
            buffer = buffer.slice(0, -1);
        } else if (code === 9) {
            buffer += '\\t';
        } else if (code < 32 || code === 127) {
            buffer += `<0x${code.toString(16).padStart(2, '0')}>`;
        } else {
            buffer += char;
        }
    }

    return buffer;
}

function executeDockerCommand(containerName, username, command) {
    return new Promise((resolve, reject) => {
        if (!username || typeof username !== 'string') {
            console.error('[SERVER] Invalid username provided for docker exec.');
            return reject(new Error('Invalid username for docker exec.'));
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
