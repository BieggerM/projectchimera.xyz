// js/main.js
import term from './terminal.js';
import { isLocalCommand, executeLocalCommand } from './commands.js';
import AnsiToHtml from 'https://esm.sh/ansi-to-html';
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

// --- WEBSOCKET CONNECTION ---
const websocketUrl = `ws://192.168.0.99:3000/terminal`;
let ws;
let backendBuffer = '';

/**
 * A helper function to remove all ANSI escape codes from a string.
 * We use this to reliably check the content of the buffer without
 * being confused by color codes or other control characters.
 * @param {string} str The string to clean.
 * @returns {string} The cleaned string.
 */
function stripAnsi(str) {
    // This regex matches all ANSI escape codes.
    return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}


function connectToBackend() {
    ws = new WebSocket(websocketUrl);

    ws.onopen = () => {
        console.log('Connected to backend shell.');
        term.print({ html: 'Backend shell connection <span class="output-item">[ESTABLISHED]</span>. Welcome.' });
        // The prompt will be shown by the first onmessage event.
    };

    ws.onmessage = (event) => {
        const ansiToHtml = new AnsiToHtml({ fg: 'var(--foreground)', bg: 'var(--background)' });
        backendBuffer += event.data;
        
        // Clean the buffer of invisible characters for logical checks
        const cleanBuffer = stripAnsi(backendBuffer);
        
        // Check if the cleaned buffer ends with our known prompt pattern
        if (cleanBuffer.endsWith(':~$ ') || cleanBuffer.endsWith(':/# ')) {
            // Split the original buffer (with colors) into lines
            const lines = backendBuffer.split('\n');
            
            // The last line is the prompt, which we don't want to display
            const outputLines = lines.slice(0, -1);
            
            // The first line might be the echoed command, let's remove it
            let finalLines = outputLines;
            if (state.history.length > 0) {
                const lastCommand = state.history[0];
                if (finalLines.length > 0 && stripAnsi(finalLines[0]).trim().endsWith(lastCommand)) {
                    finalLines = finalLines.slice(1);
                }
            }
            
            // Join the remaining lines and convert to HTML
            const rawOutput = finalLines.join('\n');
            if (rawOutput) {
                const htmlOutput = ansiToHtml.toHtml(rawOutput);
                term.print({ html: htmlOutput });
            }

            // Reset for the next command
            backendBuffer = '';
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