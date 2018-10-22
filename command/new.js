const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const catcher = require('../lib/catcher');
const delay = require('../utils/delay');
const Addtion = require('../lib/addtion');
const questions = {
  project: {
    type: 'input',
    name: 'project',
    message: '输入项目名',
    validate(name) {
      if (!name) return '项目名不能为空';
      return /^[a-z0-9_\-]+$/.test(name) ? true : '项目名格式不正确';
    }
  },
  socket: {
    type: 'confirm',
    name: 'socket',
    message: '是否使用socket常链接模式',
    default: false
  },
  port: {
    type: 'input',
    name: 'port',
    message: '项目启动端口',
    default: '8080',
    validate(port) {
      if (isNaN(port)) return '端口必须为数字';
      if (Number(port) < 2000 || Number(port) > 60000) return '端口必须大于2000或者小于60000';
      return true;
    }
  },
  env: {
    type: 'checkbox',
    name: 'env',
    message: '自定义项目环境参数（已自动包含development与production环境）',
    choices: ['test', 'stable'],
    default: []
  },
  debug: {
    type: 'confirm',
    name: 'debug',
    message: '是否开启调试功能',
    default: false
  },
  max: {
    type: 'input',
    name: 'max',
    message: '最大子进程数(`0`表示根据机器CPU个数而定)',
    default: '0'
  },
  framework: {
    type: 'radio',
    name: 'framework',
    message: '服务框架选择',
    choices: ['@clusic/rex'],
    default: '@clusic/rex'
  },
};
const InstallDeps = {
  "@clusic/rex": ["@clusic/method", "@clusic/rex"]
};
const files = [];
module.exports = (cmd, configs, project) => {
  const question = [];
  const prompt = inquirer.createPromptModule();
  if (!project) question.push(questions.project);
  question.push(questions.socket, questions.port, questions.env, questions.debug, questions.max, questions.framework);
  prompt(question).then(result => catcher(async roll => {
    console.log();
    if (!project) project = result.project;
    const projectDir = path.resolve(process.cwd(), result.project);
    if (fs.existsSync(projectDir)) throw new Error('项目已存在');
    fs.mkdirSync(projectDir); roll(() => fse.removeSync(projectDir));cmd.await('+', '[Dictionary]', projectDir); await delay(100);
    const args = [`--port=${result.port}`];
    if (result.socket) args.push('--socket');
    if (Number(result.max)) args.push(`--max=${result.max}`);
    if (result.debug) args.push('--debug');
    const addtion = new Addtion(cmd, roll);
    pushFile('babelrc.ejs', path.resolve(projectDir, '.babelrc'));
    pushFile('gitignore.ejs', path.resolve(projectDir, '.gitignore'));
    pushFile('plugin.json.ejs', path.resolve(projectDir, 'config', 'plugin.json'));
    pushFile('plugin.json.ejs', path.resolve(projectDir, 'config', 'plugin.development.json'));
    pushFile('plugin.json.ejs', path.resolve(projectDir, 'config', 'plugin.production.json'));
    pushFile('app.bootstrap.js.ejs', path.resolve(projectDir, 'app.bootstrap.js'));
    pushFile('package.json.ejs', path.resolve(projectDir, 'package.json'), {
      name: result.project,
      args: args.join(' '),
      framework: result.framework
    });
    for (let i = 0; i < files.length; i++) await addtion.render(files[i].template, files[i].where, files[i].data);
    await addtion.controller(projectDir, 'index');
    cmd.debug('开始安装依赖...');
    await addtion.install(projectDir, ...InstallDeps[result.framework]);
    cmd.complete({
      prefix: '[Install]',
      message: `OK, ${addtion.addCount} files has been added. All done!`,
      suffix: '(' + result.framework + ')'
    });
  })).catch(cmd.error);
};

function pushFile(template, where, data) {
  files.push({ template, where, data });
}