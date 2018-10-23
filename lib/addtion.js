const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const delay = require('../utils/delay');
const ChildProcess = require('child_process');
const utils = require('@clusic/utils');
const uniq = require('array-uniq');

module.exports = class Addtion {
  constructor(cmd, roll) {
    this.cmd = cmd;
    this.roll = roll;
    this.addCount = 0;
    this.modifyCount = 0;
  }
  
  async render(template, output, data = {}) {
    template = path.resolve(__dirname, '..', 'template', template);
    output = path.resolve(process.cwd(), output);
    if (!fs.existsSync(template)) throw new Error('找不到模板文件:' + template);
    const code = await new Promise((resolve, reject) => {
      ejs.renderFile(template, data, function(err, str){
        if (err) return reject(err);
        resolve(str);
      });
    });
    if (!fs.existsSync(output)) this.addFile(output, code);
    await delay(100);
  }

  addFile(output, code) {
    fse.outputFileSync(output, code, 'utf8');
    this.roll(() => fse.removeSync(output));
    this.cmd.await('+', '[File]', output);
    this.addCount++;
  }

  updateFile(output, content, _content) {
    fse.outputFileSync(output, content, 'utf8');
    this.roll(() => fse.outputFileSync(output, _content, 'utf8'));
    this.cmd.success('+', output);
    this.modifyCount++;
  }
  
  prefix(...names) {
    const name = names.join('_').replace(/\//g, '_').replace(/[_-][a-z0-9]/ig, s => s.substring(1).toUpperCase());
    let first = name.charAt(0);
    const next = name.substring(1);
    return first.toUpperCase() + next;
  }
  
  async controller(cwd, ...names) {
    let filePath = names.join('/');
    if (!/\.js$/.test(filePath)) filePath += '.js';
    await this.render('controller.js.ejs', path.resolve(cwd, 'app', 'controller', filePath), {
      className: this.prefix(...names) + 'Controller'
    });
  }
  
  async middleware(cwd, ...names) {
    let filePath = names.join('/');
    if (!/\.js$/.test(filePath)) filePath += '.js';
    await this.render('middleware.js.ejs', path.resolve(cwd, 'app', 'middleware', filePath));
  }
  
  async service(cwd, ...names) {
    let filePath = names.join('/');
    if (!/\.js$/.test(filePath)) filePath += '.js';
    await this.render('service.js.ejs', path.resolve(cwd, 'app', 'service', filePath), {
      className: this.prefix(...names) + 'Service'
    });
  }
  
  install(cwd, ...plugins) {
    return new Promise((resolve, reject) => {
      plugins.unshift('i');
      plugins.push('--save');
      const ls = ChildProcess.spawn('npm', plugins, { silent: true, cwd: cwd });
      let errors = [];
      ls.stdout.on('data', data => data.toString().split('\n').forEach(str => str && str.trim() && str.trim().length && this.cmd.success(str)));
      ls.stderr.on('data', data => data.toString().split('\n').forEach(str => {
        if (str && str.trim() && str.trim().length){
          this.cmd.watch(str);
          errors.push(str);
        }
      }));
      ls.on('exit', code => {
        if (code === 0) return resolve();
        reject(new Error('npm install catch error:' + errors.join('#')));
      });
    });
  }
  
  uninstall(cwd, ...plugins) {
    return new Promise((resolve, reject) => {
      plugins.unshift('uninstall');
      plugins.push('--save');
      const ls = ChildProcess.spawn('npm', plugins, { silent: true, cwd: cwd });
      let errors = [];
      ls.stdout.on('data', data => data.toString().split('\n').forEach(str => str && str.trim() && str.trim().length && this.cmd.success(str)));
      ls.stderr.on('data', data => data.toString().split('\n').forEach(str => {
        if (str && str.trim() && str.trim().length){
          this.cmd.watch(str);
          errors.push(str);
        }
      }));
      ls.on('exit', code => {
        if (code === 0) return resolve();
        reject(new Error('npm install catch error:' + errors.join('#')));
      });
    });
  }
  
  async plugin(cwd, ...plugins) {
    const pluginFile = path.resolve(cwd, 'config', 'plugin.json');
    let content = utils.loadFile(pluginFile);
    const _content = JSON.stringify(content, null, 2);
    await this.install(cwd, ...plugins);
    this.roll(async () => await this.uninstall(cwd, ...plugins));
    plugins.forEach(plugin => {
      content[plugin] = {
        enable: true
      }
    });
    this.updateFile(pluginFile, JSON.stringify(content, null, 2), _content);
    await delay(100);
    const result = {};
    for (let i = 0; i < plugins.length; i++) {
      const installFilePath = path.resolve(cwd, 'node_modules', plugins[i], '.clusic/install.js');
      if (fs.existsSync(installFilePath)) {
        const installFileExports = utils.loadFile(installFilePath);
        if (typeof installFileExports === 'function') {
          const res = await installFileExports(this, plugins[i]);
          if (res) result[plugins[i]] = res;
        }
      }
    }
    const files = fs.readdirSync(path.resolve(cwd, 'config'));
    for (let j = 0; j < files.length; j++) {
      if (/^plugin\.([^.]+)\.json$/.test(files[j])) {
        const pluginEnvFilePath = path.resolve(cwd, 'config', files[j]);
        const pluginEnvFileExports = utils.loadFile(pluginEnvFilePath);
        const _pluginEnvFileExports = JSON.stringify(pluginEnvFileExports, null, 2);
        for (const n in result) pluginEnvFileExports[n] = result[n];
        this.updateFile(
          pluginEnvFilePath, 
          JSON.stringify(pluginEnvFileExports, null, 2), 
          _pluginEnvFileExports
        );
        await delay(100);
      }
    }
  }
  
  async env(cwd, ...envs) {
    const pluginFile = path.resolve(cwd, 'config', 'plugin.json');
    const plugins = utils.loadFile(pluginFile);
    const result = {};
    for (const plugin in plugins) {
      const installFilePath = path.resolve(cwd, 'node_modules', plugin, '.clusic/install.js');
      if (fs.existsSync(installFilePath)) {
        const installFileExports = utils.loadFile(installFilePath);
        if (typeof installFileExports === 'function') {
          const res = await installFileExports(this, plugin);
          if (res) result[plugin] = res;
        }
      }
    }
  
    const pkg = utils.loadFile(path.resolve(cwd, 'package.json'));
    const _pkg = JSON.stringify(pkg, null, 2);
    for (let i = 0; i < envs.length; i++) {
      const envFilePath = path.resolve(cwd, 'config', `plugin.${envs[i]}.json`);
      if (!fs.existsSync(envFilePath)) await this.render('plugin.json.ejs', envFilePath);
      if (!pkg.scripts[envs[i]]) {
        pkg.scripts[envs[i]] = pkg.scripts.start.replace(/production/ig, envs[i]);
        this.addFile(envFilePath, JSON.stringify(result, null, 2));
      }
    }
    this.updateFile(path.resolve(cwd, 'package.json'), JSON.stringify(pkg, null, 2), _pkg);
  }
  
  async agent(cwd, ...agents) {
    const pkg = utils.loadFile(path.resolve(cwd, 'package.json'));
    const _pkg = JSON.stringify(pkg, null, 2);
    pkg.clusic.agents.push(...agents);
    pkg.clusic.agents = uniq(pkg.clusic.agents);
    this.updateFile(path.resolve(cwd, 'package.json'), JSON.stringify(pkg, null, 2), _pkg);
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const agentFilePath = path.resolve(cwd, `${agent}.bootstrap.js`);
      await this.render('agent.js.ejs', agentFilePath);
    }
  }
};