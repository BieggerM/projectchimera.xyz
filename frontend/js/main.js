// main.js

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

function resolveWebSocketUrl() {
  const host = window.location.hostname;
  if (!host) {
    return "ws://localhost:3000/terminal";
  }
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.");
  if (isLocal) {
    return `ws://${host}:3000/terminal`;
  }
  return `wss://${host}/terminal`;
}

const websocketUrl = resolveWebSocketUrl();
const ws = new WebSocket(websocketUrl);

ws.onopen = () => {
  term.write("Connection [ESTABLISHED].\r\n\r\n");
  term.focus();
  sendResizeToBackend(term.cols, term.rows);
  pingIntervalId = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 5000); // Send a ping every 5 seconds
};

ws.onmessage = (event) => {
  try {
    const command = JSON.parse(event.data);
    if (command.type === "special_event" && command.payload) {
      triggerGlitchEffect(term, command.payload);
    } else if (command.type === "glitch_reboot_sequence") {
      triggerImmersiveGlitchAndReboot(term, ws, sendResizeToBackend);
    } else if (command.type === "game_complete") { 
      console.log("Game complete signal received!");
      showEndScreen();
    } else if (command.type === 'pong') {
      // console.log("Received WebSocket pong."); // For debugging
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

function showEndScreen() {
  const terminalContainer = document.getElementById("terminal-container");
  const glitchOverlay = document.getElementById("glitch-overlay");
  const endScreen = document.getElementById("end-screen");
  const restartButton = document.getElementById("restart-game-button");

  terminalContainer.style.display = 'none';
  if (glitchOverlay) glitchOverlay.style.display = 'none';
  document.body.classList.remove("glitching"); 
  endScreen.style.display = 'flex';
  setTimeout(() => {
      endScreen.classList.add('visible');
  }, 10);


  restartButton.onclick = () => {
      console.log("Restarting game...");
      window.location.reload();
  };

  term.blur();
}