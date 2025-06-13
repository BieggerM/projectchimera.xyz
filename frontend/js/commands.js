// js/commands.js

const themes = {
    light: {
        '--background': '#f2f2f2',
        '--foreground': '#333333',
        '--prompt': '#007bff',
        '--command': '#d94a8c',
        '--item': '#28a745',
        '--dir': '#007bff'
    },
    default: {
        '--background': '#1a1b26',
        '--foreground': '#c0caf5',
        '--prompt': '#7aa2f7',
        '--command': '#bb9af7',
        '--item': '#9ece6a',
        '--dir': '#7aa2f7'
    }
};

const localCommands = {
    help: {
        description: 'Shows a list of available local commands.',
        execute: (term) => {
            term.print([
                { html: '<span class="output-title">Hybrid Shell Help</span>' },
                'These commands are handled by the browser. All other commands are sent to the real shell.',
                ''
            ]);
            for (const [name, { description }] of Object.entries(localCommands)) {
                term.print({ html: `  <span class="output-command">${name.padEnd(10)}</span> - ${description}` });
            }
        }
    },
    clear: {
        description: 'Clears the terminal screen.',
        execute: (term) => term.clear()
    },
    neofetch: {
        description: 'Displays system information (simulated).',
        execute: (term, args, state) => {
            // The ASCII art for the neofetch command
            const art = `
   <span class="output-neofetch-art">    .---.      </span>
   <span class="output-neofetch-art">   /     \\     </span>
   <span class="output-neofetch-art">   \\.@-@./     </span>
   <span class="output-neofetch-art">   / \`--"__\\     </span>
   <span class="output-neofetch-art">  //  _  \\\\    </span>
   <span class="output-neofetch-art"> | \\/    |/   </span>
   <span class="output-neofetch-art"> '-\\_.-\` /    </span>
   <span class="output-neofetch-art">   \`---,\`      </span>`;
            // *** THE FIX IS ABOVE: The backtick in the art has been escaped with a backslash. ***

            term.print([
                { html: art },
                { html: `<span class="output-command">${state.user}@${state.host}</span>`},
                '-------------------',
                `OS: Hybrid Shell`,
                `Host: ${state.host}`,
                `Kernel: Browser (Gecko/WebKit/Blink)`,
                `Uptime: ${Math.floor((new Date() - state.startTime) / 1000)}s`,
                'Shell: hybrid-bash',
                ''
            ]);
        }
    },
    theme: {
        description: 'Changes the terminal theme. Usage: theme [default|light]',
        execute: (term, args) => {
            const themeName = args[0] || 'default';
            const theme = themes[themeName];
            if (theme) {
                for (const [key, value] of Object.entries(theme)) {
                    document.documentElement.style.setProperty(key, value);
                }
                term.print(`Theme set to ${themeName}.`);
            } else {
                term.print({ html: `<span class="output-error">Error: Theme '${themeName}' not found.</span>`});
            }
        }
    }
};

export function isLocalCommand(command) {
    return command in localCommands;
}

export function executeLocalCommand(input, term, state) {
    const [command, ...args] = input.split(' ');
    if (isLocalCommand(command)) {
        localCommands[command].execute(term, args, state);
        return true;
    }
    return false;
}