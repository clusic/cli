#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');
const { Signale } = require('signale');
const utils = require('@clusic/utils');
const parseArgv = require('./utils/parse-argv');
const argvResult = parseArgv(process.argv.slice(2));
const file = path.resolve(__dirname, 'command', ...argvResult._);
const cmd = new Signale({
  interactive: true,
  scope: 'clusic',
  types: {
    version: {
      badge: '🎅',
      color: 'green',
      label: 'version'
    }
  }
});

if (argvResult._.length) {
  const allFile = path.resolve(__dirname, 'command', ...argvResult._);
  if (fs.existsSync(allFile + '.js')) {
    utils.loadFile(file)(cmd, argvResult);
  } else {
    const singleFile = path.resolve(__dirname, 'command', ...argvResult._.slice(0, 1));
    if (fs.existsSync(singleFile + '.js')) {
      utils.loadFile(singleFile)(cmd, argvResult, ...argvResult._.slice(1));
    }
  }
} else {
  cmd.version(pkg.version);
}
