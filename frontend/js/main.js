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

// --- NEUE FUNKTION FÜR DEN GLITCH-EFFEKT ---
function triggerGlitchEffect(payload) {
  const glitchChars = "▓▒░█";
  let counter = 0;
  const interval = setInterval(() => {
    if (counter >= 15) {
      // Anzahl der Glitch-Zeilen
      clearInterval(interval);
      term.clear(); // Terminal leeren
      // \x1b[31m setzt die Farbe auf Rot, \x1b[0m setzt sie zurück
      term.write(`\r\n\x1b[31mSYSTEM INTEGRITY COMPROMISED.\x1b[0m\r\n`);
      term.write(`A new log file was created: ${payload.logfileName}\r\n\r\n`);
      return;
    }

    let line = "";
    for (let i = 0; i < term.cols; i++) {
      line += glitchChars[Math.floor(Math.random() * glitchChars.length)];
    }
    term.write(`\r${line}`); // \r springt an den Zeilenanfang für den Überschreib-Effekt
    counter++;
  }, 50); // Geschwindigkeit des Glitches (in ms)
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- IMMERSIVE GLITCH AND REBOOT SEQUENCE ---
async function triggerImmersiveGlitchAndReboot() {
  const glitchOverlay = document.getElementById("glitch-overlay"); // Optional overlay
  const glitchDuration = 3000; // Total duration of the visual glitch in ms
  const rebootMessageDelay = 150; // Delay between reboot messages
  const preGlitchMessageDelay = 200; // Delay for pre-glitch messages
  let terminalGlitchInterval;

  // 0. Pre-Glitch System Failure Messages
  const failureMessages = [
    "\r\n\x1b[31mSYSTEM ALERT: KERNEL INTEGRITY COMPROMISED...\x1b[0m",
    "Segment_Fault @ 0xDEADBEEF",
    "Memory Core Dump Initializing...",
    "SYSTEM FAILURE IMMINENT!",
    "kErNeL pAnIc - UnAbLe tO CoNtInUe...",
  ];

  for (const msg of failureMessages) {
    term.write(msg + "\r\n");
    await new Promise((resolve) =>
      setTimeout(resolve, preGlitchMessageDelay + Math.random() * 150)
    ); // Add some randomness
  }
  await new Promise((resolve) => setTimeout(resolve, 500)); // Pause before full glitch

  // 1. Start Page Flicker
  document.body.classList.add("glitching");
  if (glitchOverlay) glitchOverlay.style.display = "block";

  // 2. Start Terminal Glitch (fill with random characters)
  const glitchChars = "▓▒░█?#@*&!$ERROR<SYS_FAIL>0101010<CRITICAL>%^!@#";
  terminalGlitchInterval = setInterval(() => {
    let line = "";
    for (let i = 0; i < term.cols; i++) {
      line += glitchChars[Math.floor(Math.random() * glitchChars.length)];
    }
    term.write(`\r${line}`);
    term.write("\r\n");
  }, 30); // Faster terminal glitch

  // 3. After glitchDuration, stop effects and start reboot sequence
  await new Promise((resolve) => setTimeout(resolve, glitchDuration));

  clearInterval(terminalGlitchInterval);
  document.body.classList.remove("glitching");
  if (glitchOverlay) glitchOverlay.style.display = "none";
  term.clear();

  const rebootSequence = [
    "\r\n\x1b[31mCRITICAL SYSTEM ERROR DETECTED: KERNEL INTEGRITY BREACH...\x1b[0m",
    "Emergency Protocol Engaged: Attempting rapid rollback and session preservation sequence...",
    " ",
    "Initiating System Diagnostic Subroutines:",
    "  NVRAM Check.....................[\x1b[32mOK\x1b[0m]",
    "  CPU Integrity Test..............[\x1b[32mOK\x1b[0m]",
    "  Memory Bank Scan................[\x1b[32mOK\x1b[0m]",
    "  Filesystem Consistency Check....[\x1b[32mOK\x1b[0m]",
    "  Hardware Abstraction Layer Init.[\x1b[32mOK\x1b[0m]",
    "  Network Interface Health........[\x1b[32mOK\x1b[0m]",
    "  Peripheral Device Scan..........[\x1b[32mOK\x1b[0m]",
    " ",
    "WARNING: Core system service `nf_hook_slow` reported unexpected state. Isolated and restarting.",
    "STATUS: Anomalous process activity identified and contained. Rogue threads forcefully terminated.",
    "STATUS: Performing immediate active session state dump to secure non-volatile buffer. (Size: 3.7 GB)",
    "  Progress: [                                                  ] 0%",
    "  Progress: [######                                            ] 12%",
    "  Progress: [############                                      ] 24%",
    "  Progress: [##################                                ] 36%",
    "  Progress: [########################                          ] 48%",
    "  Progress: [##############################                    ] 60%",
    "  Progress: [####################################              ] 72%",
    "  Progress: [##########################################        ] 84%",
    "  Progress: [################################################  ] 96%",
    "  Progress: [##################################################] 100%",
    "STATUS: Session state successfully preserved. Checksum verified: E7D4B2A9C1F8. Resilience protocol active.",
    " ",
    "Executing Emergency Recovery Sequence:",
    "  Reloading Kernel Modules........[\x1b[32mOK\x1b[0m]",
    "  Re-initializing Core Systems....[\x1b[32mOK\x1b[0m]",
    "  Loading ISOPOD Environment......[\x1b[32mOK\x1b[0m]",
    "  Restoring Network Services......[\x1b[32mOK\x1b[0m]",
    "  Remounting Filesystems..........[\x1b[32mOK\x1b[0m]",
    "  Applying Security Patches.......[\x1b[32mOK\x1b[0m] (Hotfix KSA-2025-003 applied automatically)",
    "  Restoring User Session..........",
    "...",
    "System Online. Welcome back.",
    "Session restored from buffer. All user processes re-attached.",
    "Minimal data loss detected: 0.0000003% (below threshold, automatically reconstructed).",
    "System integrity restored. Monitoring for recurrence.",
    "\r\n",
  ];

  for (const msg of rebootSequence) {
    term.write(msg + "\r\n");
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 300));
  }
  term.focus();
  sendResizeToBackend(term.cols, term.rows);
  // Send a newline to the backend to ensure the prompt is displayed
  ws.send("\r\n");
}

// --- ERSETZTER NACHRICHTEN-HANDLER ---
ws.onmessage = (event) => {
  try {
    const command = JSON.parse(event.data);
    if (command.type === "special_event" && command.payload) {
      triggerGlitchEffect(command.payload); // For the log file event
    } else if (command.type === "glitch_reboot_sequence") {
      triggerImmersiveGlitchAndReboot();
    }
    // else if (other commands...)
  } catch (e) {
    // If it's not valid JSON or an unhandled command, treat as normal terminal text.
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
