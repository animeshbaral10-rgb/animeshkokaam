const { spawn } = require('child_process');
const path = require('path');

const nextDev = spawn('npx', ['next', 'dev'], {
  cwd: path.join(__dirname),
  stdio: 'inherit',
  shell: true,
});

nextDev.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

nextDev.on('close', (code) => {
  process.exit(code ?? 0);
});
