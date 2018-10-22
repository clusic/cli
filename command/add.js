const fs = require('fs');
const path = require('path');
const utils = require('@clusic/utils');
const Addtion = require('../lib/addtion');
const catcher = require('../lib/catcher');
module.exports = (cmd, configs, ...args) => {
  const pkgFile = path.resolve(process.cwd(), 'package.json');
  const project = fs.existsSync(pkgFile) ? utils.loadFile(pkgFile).name : '@clusic';
  catcher(async roll => {
    const cwd = process.cwd();
    const addtion = new Addtion(cmd, roll);
    
    if (configs.controller) await addtion.controller(cwd, ...args);
    if (configs.middleware) await addtion.middleware(cwd, ...args);
    if (configs.service) await addtion.service(cwd, ...args);
    if (configs.plugin) await addtion.plugin(cwd, ...args);
    if (configs.env) await addtion.env(cwd, ...args);
    if (configs.agent) await addtion.agent(cwd, ...args);
    
    const pluginFile = path.resolve(cwd, 'config', 'plugin.json');
    const plugins = utils.loadFile(pluginFile);
    for (const plugin in plugins) {
      const installFilePath = path.resolve(cwd, 'node_modules', plugin, '.clusic/command.js');
      if (fs.existsSync(installFilePath)) {
        const installFileExports = utils.loadFile(installFilePath);
        if (typeof installFileExports === 'function') {
          await installFileExports(addtion, cwd, cmd, configs, ...args);
        }
      }
    }
    
    cmd.complete({
      prefix: '[Make]',
      message: `OK, files status: [+${addtion.addCount}] [*${addtion.modifyCount}] [-${addtion.removeCount}]`,
      suffix: '(@' + project + ')'
    });
  }).catch(cmd.error);
};