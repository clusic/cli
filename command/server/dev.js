const path = require('path');
const childProcess = require('child_process');
const serverPath = path.resolve(__dirname, '../../server.js');

module.exports = (cmd, configs) => {
  const args = configs.__.slice(2);
  args.unshift(serverPath);
  childProcess.spawn('node', args, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
};