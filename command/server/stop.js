const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

module.exports = (cmd, configs) => {
  const pkgfile = path.resolve(process.cwd(), 'package.json');
  const name = fs.existsSync(pkgfile) ? require(pkgfile).name : configs.name;
  const args = ['stop', name || 'untitled'];
  childProcess.spawn('pm2', args, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
};