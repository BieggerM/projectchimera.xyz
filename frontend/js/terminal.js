// js/terminal.js

const outputEl = document.getElementById('output');
const inputLineEl = document.getElementById('input-line');
const commandInputEl = document.getElementById('command-input');
const promptEl = document.getElementById('prompt');
const scrollWrapperEl = document.getElementById('scroll-wrapper');

let isLocked = false;

function scrollToBottom() {
    scrollWrapperEl.scrollTop = scrollWrapperEl.scrollHeight;
}

function print(message) {
    const messages = Array.isArray(message) ? message : [message];
    for (const msg of messages) {
        const lineEl = document.createElement('div');
        lineEl.classList.add('line');
        if (typeof msg === 'object' && msg.html) {
            lineEl.innerHTML = msg.html;
        } else {
            lineEl.textContent = msg;
        }
        outputEl.appendChild(lineEl);
    }
    scrollToBottom();
}

function clear() {
    outputEl.innerHTML = '';
}

function showPrompt(state) {
    promptEl.innerHTML = `${state.user}@${state.host}:${state.cwd.replace(`/home/${state.user}`, '~')}$`;
    inputLineEl.style.display = 'flex';
    commandInputEl.focus();
    isLocked = false;
    scrollToBottom();
}

function hidePrompt() {
    inputLineEl.style.display = 'none';
}

function lock() {
    isLocked = true;
}

function unlock() {
    isLocked = false;
    commandInputEl.focus();
}

function locked() {
    return isLocked;
}

function initViewportHandler() {
    document.body.addEventListener('click', () => {
        commandInputEl.focus();
    });
}

export default { print, clear, showPrompt, hidePrompt, lock, unlock, locked, initViewportHandler };