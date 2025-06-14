// js/main.js

const term = new Terminal({
    fontFamily: "'Fira Mono', monospace",
    fontSize: 16,
    cursorBlink: true,
    theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        selectionBackground: '#414868',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5',
    }
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

const termContainer = document.getElementById('terminal-container');
term.open(termContainer);

fitAddon.fit();
window.addEventListener('resize', () => fitAddon.fit());

term.write('Welcome to your fully interactive and secure web terminal!\r\n');
term.write('Connecting to backend...\r\n');


const websocketUrl = `ws://192.168.0.99:3000/terminal`;
const ws = new WebSocket(websocketUrl);
let backendBuffer = ''; // A buffer to handle chunked data

function sendResizeToBackend(cols, rows) {
    if (ws.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
            type: 'resize',
            cols: cols,
            rows: rows
        });
        ws.send(message);
    }
}

ws.onopen = () => {
    term.write('Connection [ESTABLISHED].\r\n\r\n');
    term.focus();
    sendResizeToBackend(term.cols, term.rows);
};

// --- THIS IS THE NEW, ROBUST MESSAGE HANDLER ---
ws.onmessage = (event) => {
    // Always append incoming data to our buffer
    backendBuffer += event.data;

    const actionPrefix = "ACTION:OPEN_URL:";
    let actionIndex = backendBuffer.indexOf(actionPrefix);

    // Check if the complete action string exists in our buffer
    if (actionIndex !== -1) {
        // Extract the part of the buffer after the action prefix
        const urlPart = backendBuffer.substring(actionIndex + actionPrefix.length);
        
        // The URL is everything from there until the next newline character
        const url = urlPart.split('\n')[0].trim();
        
        if (url) {
            console.log(`ACTION: Opening URL: ${url}`);
            window.open(url, '_blank');
        }

        // Clear the buffer so we don't process the action again
        backendBuffer = '';

        // We still need to ask the backend for a fresh prompt to keep the shell state clean
        if (ws.readyState === WebSocket.OPEN) {
            ws.send('\n');
        }

    } else {
        // If no action string is found, write the whole buffer to the terminal
        // and then clear it. xterm.js will handle rendering everything correctly.
        term.write(backendBuffer);
        backendBuffer = '';
    }
};

ws.onclose = () => {
    term.write('\r\n\r\nConnection [TERMINATED].');
};

ws.onerror = (error) => {
    term.write(`\r\n\r\n<Connection Error: Could not connect to backend at ${websocketUrl}>`);
};

term.onData(data => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
    }
});

term.onResize(({ cols, rows }) => {
    sendResizeToBackend(cols, rows);
});