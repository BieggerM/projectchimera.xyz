const term = new Terminal({
  fontFamily: "'Fira Mono', monospace",
  fontSize: 16,
  cursorBlink: true,
  theme: {
    background: "#1a1b26",
    foreground: "#c0caf5",
    cursor: "#c0caf5",
    selectionBackground: "#414868",
    black: "#15161e",
    red: "#f7768e",
    green: "#9ece6a",
    yellow: "#e0af68",
    blue: "#7aa2f7",
    magenta: "#bb9af7",
    cyan: "#7dcfff",
    white: "#a9b1d6",
    brightBlack: "#414868",
    brightRed: "#f7768e",
    brightGreen: "#9ece6a",
    brightYellow: "#e0af68",
    brightBlue: "#7aa2f7",
    brightMagenta: "#bb9af7",
    brightCyan: "#7dcfff",
    brightWhite: "#c0caf5",
  },
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

const termContainer = document.getElementById("terminal-container");
term.open(termContainer);

fitAddon.fit();
window.addEventListener("resize", () => fitAddon.fit());

term.write("Welcome to your fully interactive and secure web terminal!\r\n");
term.write("Connecting to backend...\r\n");

const websocketUrl = `ws://192.168.0.99:3000/terminal`;
const ws = new WebSocket(websocketUrl);

ws.onopen = () => {
  term.write("Connection [ESTABLISHED].\r\n\r\n");
  term.focus();
  sendResizeToBackend(term.cols, term.rows);
};

// --- ERSETZTER NACHRICHTEN-HANDLER ---
ws.onmessage = (event) => {
  try {
    const command = JSON.parse(event.data);
    if (command.type === "special_event" && command.payload) {
      triggerGlitchEffect(term, command.payload);
    } else if (command.type === "glitch_reboot_sequence") {
      triggerImmersiveGlitchAndReboot(term, ws, sendResizeToBackend);
    } else {
      term.write(event.data);
    }
  } catch (e) {
    term.write(event.data);
  }
};

ws.onclose = () => {
  term.write("\r\n\r\nConnection [TERMINATED].");
};

ws.onerror = (error) => {
  term.write(
    `\r\n\r\n<Connection Error: Could not connect to backend at ${websocketUrl}>`
  );
};

term.onData((data) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(data);
  }
});

term.onResize(({ cols, rows }) => {
  sendResizeToBackend(cols, rows);
});

function sendResizeToBackend(cols, rows) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "resize", cols, rows }));
  }
}
