import { spawn } from 'node:child_process';

// Get port from CLI args, environment variable, or default to 3000
const args = process.argv.slice(2);
let port = process.env.PORT || '3000';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-p' || args[i] === '--port') {
    if (args[i + 1] && !args[i + 1].startsWith('-')) {
      port = args[i + 1];
      i++;
    }
  } else if (/^\d+$/.test(args[i])) {
    port = args[i];
  }
}

const child = spawn('npx', ['next', 'dev', '.', '-p', port], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
