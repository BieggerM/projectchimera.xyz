// js/main.js
import term from './terminal.js';
import { isLocalCommand, executeLocalCommand } from './commands.js';

// --- DOM ELEMENTS AND STATE ---
const commandInputEl = document.getElementById('command-input');
const outputEl = document.getElementById('output');

const state = {
    user: 'hybrid',
    host: 'web-terminal',
    cwd: '~', // We'll let the backend manage the CWD, this is just for display
    history: [],
    historyIndex: -1,
    startTime: new Date()
};

// --- WEBSOCKET CONNECTION TO REAL SHELL ---
const websocketUrl = `ws://192.168.0.99:3000/terminal`;
let ws;
let backendBuffer = '';

function connectToBackend() {
    ws = new WebSocket(websocketUrl);

    ws.onopen = () => {
        console.log('Connected to backend shell.');
        term.print({ html: 'Backend shell connection <span class="output-item">[ESTABLISHED]</span>. Welcome.' });
        term.unlock();
        term.showPrompt(state);
    };

    ws.onmessage = (event) => {
        backendBuffer += event.data;

        // --- THIS IS THE CORRECTED LOGIC ---
        // The default bash prompt for our non-root user ends with '$ '.
        // This is our signal that a command has finished executing.
        const prompt_signal = '$ ';

        if (backendBuffer.endsWith(prompt_signal)) {
            // Remove the prompt signal itself from the output buffer
            let cleanOutput = backendBuffer.substring(0, backendBuffer.lastIndexOf(prompt_signal));

            // The pty often echoes the command we just sent. We can clean that up.
            const lastCommand = state.history[0];
            if (lastCommand && cleanOutput.startsWith(lastCommand)) {
                cleanOutput = cleanOutput.substring(lastCommand.length).trimStart();
            }
            
            // Print the final, cleaned output if there is any
            if (cleanOutput) {
                term.print(cleanOutput);
            }

            backendBuffer = ''; // Clear the buffer for the next command
            term.unlock();
            term.showPrompt(state);
        }
    };

    ws.onclose = () => {
        term.print({ html: '<span class="output-error">Backend shell connection [TERMINATED]. Please refresh the page to reconnect.</span>'});
        term.lock();
    };

    ws.onerror = (error) => {
        term.print({ html: `<span class="output-error">Connection Error: Could not connect to the backend at ${websocketUrl}. Ensure the server is running.</span>`});
        term.lock();
    };
}


// --- COMMAND PROCESSING ---
function processInput(input) {
    if (!input) return; // Don't process empty input

    term.hidePrompt(); // Hide the current input line
    
    const promptHtml = `<span class="prompt-text"><span class="math-inline">\{state\.user\}@</span>{state.host}:<span class="math-inline">\{state\.cwd\}</span></span>`;
    term.print({ html: `<span class="math-inline">\{promptHtml\} <span class\="output\-command"\></span>{input}</span>` });
    
    state.history.unshift(input);
    state.historyIndex = -1;

    // HYBRID logic
    if (isLocalCommand(input.split(' ')[0])) {
        executeLocalCommand(input, term, state);
        term.showPrompt(state);
    } else {
        // Remote command for the Docker backend
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(input + '\n');
            term.lock();
        } else {
            term.print({ html: '<span class="output-error">Error: Not connected to backend shell.</span>' });
            term.showPrompt(state);
        }
    }
}

// --- INITIALIZATION ---
async function init() {
    term.initViewportHandler();
    term.lock();
    term.print("Initializing Hybrid Terminal...");
    connectToBackend();
}

// --- EVENT LISTENERS ---
commandInput