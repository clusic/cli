const path = require('path');
const childProcess = require('child_process');
const serverPath = path.resolve(__dirname, '../../server.js');

let closing = false, timer = null;

module.exports = (cmd, configs) => {
  const args = configs.__.slice(2);
  args.unshift(serverPath);
  const ls = childProcess.spawn('node', args, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  ls.on('close', () => {
    clearInterval(timer);
    process.exit(0);
  });
};

process.on('SIGINT', close);
process.on('SIGQUIT', close);
process.on('SIGTERM', close);

function close() {
  if (closing) return;
  closing = true;
  timer = setInterval(() => {}, 10);
}