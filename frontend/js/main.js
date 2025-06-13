// js/main.js
import term from './terminal.js';
import { isLocalCommand, executeLocalCommand } from './commands.js';

// --- DOM ELEMENTS AND STATE ---
const commandInputEl = document.getElementById('command-input');

const state = {
    user: 'hybrid',
    host: 'web-terminal',
    cwd: '~',
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
        const prompt_signal = '$ ';

        if (backendBuffer.endsWith(prompt_signal)) {
            let cleanOutput = backendBuffer.substring(0, backendBuffer.lastIndexOf(prompt_signal));

            // --- THIS IS THE CORRECTED, ROBUST LOGIC ---
            // Only try to clean up the command echo if a command has actually been sent.
            // On initial connection, history is empty and we don't need to clean anything.
            if (state.history.length > 0) {
                const lastCommand = state.history[0];
                // Check if the pty echoed the command back to us
                if (lastCommand && cleanOutput.trim().startsWith(lastCommand)) {
                    // If so, remove the echoed command from the output string
                    cleanOutput = cleanOutput.trim().substring(lastCommand.length).trimStart();
                }
            }
            
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
    if (!input) return;

    term.hidePrompt();
    
    const promptHtml = `<span class="prompt-text">${state.user}@${state.host}:${state.cwd}$</span>`;
    term.print({ html: `${promptHtml} <span class="output-command">${input}</span>` });
    
    state.history.unshift(input);
    state.historyIndex = -1;

    if (isLocalCommand(input.split(' ')[0])) {
        executeLocalCommand(input, term, state);
        term.showPrompt(state);
    } else {
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
commandInputEl.addEventListener('keydown', (e) => {
    if (term.locked()) return;

    if (e.key === 'Enter') {
        const input = commandInputEl.value.trim();
        commandInputEl.value = '';
        processInput(input);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            commandInputEl.value = state.history[state.historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (state.historyIndex > -1) {
            state.historyIndex--;
            commandInputEl.value = state.historyIndex === -1 ? '' : state.history[state.historyIndex];
        }
    }
});

init();