const { spawn } = require('child_process');

console.log('Checking TypeScript compilation...');
const tscProcess = spawn('npx', ['tsc', '--noEmit'], { 
  cwd: '/workspaces/pb-jam',
  stdio: 'pipe'
});

let output = '';
tscProcess.stdout.on('data', (data) => {
  output += data.toString();
});

tscProcess.stderr.on('data', (data) => {
  output += data.toString();
});

tscProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✓ TypeScript compilation successful!');
  } else {
    console.log('✗ TypeScript compilation failed:');
    console.log(output);
  }
  process.exit(code);
});