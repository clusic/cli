const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const serverPath = path.resolve(__dirname, '../../server.js');

module.exports = (cmd, configs) => {
  const _args = configs.__.slice(2);
  const pkgfile = path.resolve(process.cwd(), 'package.json');
  const name = fs.existsSync(pkgfile) ? require(pkgfile).name : configs.name;
  const args = ['start', serverPath, '--name=' + (name || 'untitled'), '--', ..._args];
  childProcess.spawn('pm2', args, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
};