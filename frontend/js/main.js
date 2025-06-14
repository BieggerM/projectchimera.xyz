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


// --- NEUE FUNKTION FÜR DEN GLITCH-EFFEKT ---
function triggerGlitchEffect(payload) {
    const glitchChars = '▓▒░█';
    let counter = 0;
    const interval = setInterval(() => {
        if (counter >= 15) { // Anzahl der Glitch-Zeilen
            clearInterval(interval);
            term.clear(); // Terminal leeren
            // \x1b[31m setzt die Farbe auf Rot, \x1b[0m setzt sie zurück
            term.write(`\r\n\x1b[31mSYSTEM INTEGRITY COMPROMISED.\x1b[0m\r\n`); 
            term.write(`A new log file was created: ${payload.logfileName}\r\n\r\n`);
            return;
        }

        let line = '';
        for (let i = 0; i < term.cols; i++) {
            line += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        term.write(`\r${line}`); // \r springt an den Zeilenanfang für den Überschreib-Effekt
        counter++;
    }, 50); // Geschwindigkeit des Glitches (in ms)
}


// --- ERSETZTER NACHRICHTEN-HANDLER ---
ws.onmessage = (event) => {
    try {
        // Versuche, die Nachricht als JSON zu parsen.
        const command = JSON.parse(event.data);

        // Prüfe, ob es unser spezielles Ereignis ist.
        if (command.type === 'special_event') {
            triggerGlitchEffect(command.payload);
        }
        // Zukünftige Befehle wie 'open_url' könnten hier als 'else if' hinzugefügt werden.

    } catch (e) {
        // Wenn es kein gültiges JSON ist, behandle es als normalen Terminal-Text.
        term.write(event.data);
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