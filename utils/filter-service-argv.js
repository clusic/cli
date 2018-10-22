const fs = require('fs');
const path = require('path');
const utils = require('@clusic/utils');
module.exports = configs => {
  let { socket, port, env, debug, max, cwd } = configs;
  cwd = cwd ? path.resolve(process.cwd(), cwd) : process.cwd();
  const __configs = {};
  if (socket) __configs.socket = true;
  if (port) __configs.port = Number(port);
  if (env) __configs.env = env;
  if (debug) __configs.debug = true;
  if (max) __configs.max = Number(max);
  __configs.cwd = cwd;
  __configs.port = __configs.port || 8080;
  const pkg = utils.loadFile(path.resolve(process.cwd(), 'package.json'));
  const _configs = Object.assign({}, pkg.clusic || {}, __configs);
  if (!_configs.framework) throw new Error('缺少framework，无法运行');
  return _configs;
};