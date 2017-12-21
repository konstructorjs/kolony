const shell = require('shelljs');
const os = require('os');
const path = require('path');
const fs = require('fs');
const config = require('../utils/config');
const { logBase, logChild, logError } = require('../utils/logger');

const checkCommand = async (command) => {
  logBase(`checking to see if ${command} is installed`);
  if (!shell.which(command)) {
    throw new Error(`${command} is not installed`);
  }
  logChild(`${command} is installed`);
};

const setup = async () => {
  await checkCommand('git');

  await checkCommand('nginx');

  await checkCommand('node');

  await checkCommand('pm2');

  const homeDir = os.homedir();
  const kolonyDir = path.join(homeDir, './.kolony');

  logBase('looking for kolony dir');
  if (!fs.existsSync(kolonyDir)) {
    fs.mkdirSync(kolonyDir);
    logChild('created folder');
  } else {
    logChild('found folder');
  }

  logBase('creating metadata file');
  const metadata = {};
  await config.setMetadata(metadata);
  logChild('created metadata file');

  logBase('IF YOU HAVEN\'T ALREADY, RUN `pm2 startup` TO RESTART YOUR PROCESSES ON REBOOT');

  console.log();
};

module.exports.command = 'setup';
module.exports.desc = 'setup kolony';

module.exports.handler = (args) => {
  setup(args).catch((err) => {
    logError(`${err}`);
    console.log();
    process.exit(1);
  });
};
