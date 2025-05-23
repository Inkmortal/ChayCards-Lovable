// Windows Electron Launcher
// This file is used to launch Electron from Windows environment

const { spawn } = require('child_process');
const path = require('path');

// Ensure we're using the Windows node_modules
process.env.NODE_PATH = path.join(__dirname, 'node_modules_win');

// Start Vite dev server in WSL first
console.log('Starting Vite dev server in WSL...');
const viteProcess = spawn('wsl', ['-e', 'bash', '-c', 'cd /mnt/c/Users/danhc/Documents/Projects/ChayCards-Loveable && npm run dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait a bit for Vite to start
setTimeout(() => {
  console.log('Starting Electron...');
  const electronProcess = spawn('electron', ['.'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  electronProcess.on('close', () => {
    viteProcess.kill();
    process.exit();
  });
}, 3000);

process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit();
});