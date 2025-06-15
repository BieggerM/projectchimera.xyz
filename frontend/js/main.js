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

// --- IMMERSIVE GLITCH AND REBOOT SEQUENCE ---
async function triggerImmersiveGlitchAndReboot() {
    const glitchOverlay = document.getElementById('glitch-overlay'); // Optional overlay
    const glitchDuration = 3000; // Total duration of the visual glitch in ms
    const rebootMessageDelay = 150; // Delay between reboot messages
    let terminalGlitchInterval;
    let pageFlickerInterval;

    // 1. Start Page Flicker
    document.body.classList.add('glitching');
    if (glitchOverlay) glitchOverlay.style.display = 'block';

    // 2. Start Terminal Glitch (fill with random characters)
    const glitchChars = '▓▒░█?#@*&!$ERROR<SYSTEM FAILURE>01';
    terminalGlitchInterval = setInterval(() => {
        let line = '';
        for (let i = 0; i < term.cols; i++) {
            line += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        term.write(`\r${line}`);
    }, 30); // Faster terminal glitch

    // 3. After glitchDuration, stop effects and start reboot sequence
    await new Promise(resolve => setTimeout(resolve, glitchDuration));

    clearInterval(terminalGlitchInterval);
    document.body.classList.remove('glitching');
    if (glitchOverlay) glitchOverlay.style.display = 'none';
    term.clear();


    const rebootSequence = [
        "\r\n\x1b[31mCRITICAL SYSTEM ERROR DETECTED...\x1b[0m",
        "Attempting emergency reboot sequence...",
        " ",
        "NVRAM Check.....................[\x1b[32mOK\x1b[0m]",
        "CPU Integrity Test..............[\x1b[32mOK\x1b[0m]",
        "Memory Bank Scan................[\x1b[32mOK\x1b[0m]",
        "Initializing Core Systems.......",
        "Loading ISOPOD Environment......",
        "...",
        "System Online. Welcome back.",
        "\r\n"
    ];

    for (const msg of rebootSequence) {
        term.write(msg + "\r\n");
        await new Promise(resolve => setTimeout(resolve, rebootMessageDelay));
    }
    term.focus();
    sendResizeToBackend(term.cols, term.rows);
}


// --- ERSETZTER NACHRICHTEN-HANDLER ---
ws.onmessage = (event) => {
    try {
        const command = JSON.parse(event.data);
        if (command.type === 'special_event' && command.payload) {
            triggerGlitchEffect(command.payload); // For the log file event
        } else if (command.type === 'glitch_reboot_sequence') {
            triggerImmersiveGlitchAndReboot();
        }
        // else if (other commands...)
    } catch (e) {
        // If it's not valid JSON or an unhandled command, treat as normal terminal text.
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

function sendResizeToBackend(cols, rows) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
}