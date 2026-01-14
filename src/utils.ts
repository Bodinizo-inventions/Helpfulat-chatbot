const Role = {
  USER: 'user',
  ASSISTANT: 'assistant'
};

const log = (tag: string, msg: string) => {
  const overlay = document.getElementById('debug-log');
  if (overlay) {
    const line = document.createElement('div');
    line.innerText = `[${tag}] ${msg}`;
    overlay.appendChild(line);
    overlay.scrollTop = overlay.scrollHeight;
  }
};

export { Role, log };
