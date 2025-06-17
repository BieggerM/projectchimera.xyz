// animations.js

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function triggerGlitchEffect(term, payload) {
  const glitchChars = "▓▒░█";
  let counter = 0;
  const interval = setInterval(() => {
    if (counter >= 15) {
      clearInterval(interval);
      term.clear(); 
      term.write(`\r\n\x1b[31mSYSTEM INTEGRITY COMPROMISED.\x1b[0m\r\n`);
      term.write(`A new log file was created: ${payload.logfileName}\r\n\r\n`);
      return;
    }

    let line = "";
    for (let i = 0; i < term.cols; i++) {
      line += glitchChars[Math.floor(Math.random() * glitchChars.length)];
    }
    term.write(`\r${line}`); 
    counter++;
  }, 50); 
}

async function triggerImmersiveGlitchAndReboot(term, ws, sendResizeToBackendCallback) {
  const glitchOverlay = document.getElementById("glitch-overlay"); 
  const glitchDuration = 3000; 
  const preGlitchMessageDelay = 200;
  let terminalGlitchInterval;

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
    ); 
  }
  await new Promise((resolve) => setTimeout(resolve, 500)); 

  document.body.classList.add("glitching");
  if (glitchOverlay) glitchOverlay.style.display = "block";

  const glitchChars = "▓▒░█?#@*&! $ERROR <SYS_FAIL>0  101010 <CRITICAL> %^!@#";
  terminalGlitchInterval = setInterval(() => {
    let line = "";
    for (let i = 0; i < term.cols; i++) {
      line += glitchChars[Math.floor(Math.random() * glitchChars.length)];
    }
    term.write(`\r${line}`);
    term.write("\r\n");
  }, 30); 
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
    " ",
    "\x1b[31mFAILED:\x1b[0m Restoring last Session Command: absolute path <>",
  ];

  for (const msg of rebootSequence) {
    term.write(msg + "\r\n");
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 300));
  }
  term.focus();
  sendResizeToBackendCallback(term.cols, term.rows);
  // Send a newline to the backend to ensure the prompt is displayed
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send("cat /home/evance/projects/chimera/logs/subject07.log\n");
  }
}