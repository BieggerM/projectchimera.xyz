// js/main.js

// Beachten Sie, dass Terminal und FitAddon globale Variablen sind,
// die von den Skripten in index.html bereitgestellt werden.
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

// Hängen Sie das Terminal an unseren Container
const termContainer = document.getElementById('terminal-container');
term.open(termContainer);

// Passen Sie die Grösse des Terminals an den Container an
fitAddon.fit();

// Passen Sie die Grösse bei Fensteränderungen an
window.addEventListener('resize', () => fitAddon.fit());

term.write('Welcome to your fully interactive and secure web terminal!\r\n');
term.write('Connecting to backend...\r\n');


// --- WebSocket-Verbindung (jetzt radikal einfach) ---
const websocketUrl = `ws://192.168.0.99:3000/terminal`;
const ws = new WebSocket(websocketUrl);

// Wenn die Verbindung aufgeht, fokussieren Sie das Terminal
ws.onopen = () => {
    term.write('Connection [ESTABLISHED].\r\n\r\n');
    term.focus();
};

// Leite einfach alle Daten vom Backend direkt an xterm.js weiter
ws.onmessage = (event) => {
    term.write(event.data);
};

ws.onclose = () => {
    term.write('\r\n\r\nConnection [TERMINATED].');
};

ws.onerror = (error) => {
    term.write(`\r\n\r\n<Connection Error: Could not connect to backend at ${websocketUrl}>`);
};

// Leite einfach alle Benutzereingaben (Tastendrücke) direkt an das Backend weiter
term.onData(data => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
    }
});