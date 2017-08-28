const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const logBase = (message) => {
  console.log(`> ${message}`);
};

const logChild = (message) => {
  console.log(`\t${message}`);
};

const setup = async () => {
  logBase('checking to see if git is installed');
  try {
    execSync('git --version', { stdio: 'ignore' });
    logChild('git is installed');
  } catch (_) {
    logChild('[ERR] git is not installed');
  }

  logBase('checking to see if nginx is installed');
  try {
    execSync('nginx -v', { stdio: 'ignore' });
    logChild('nginx is installed');
  } catch (_) {
    logChild('[ERR] nginx is not installed');
  }

  logBase('checking to see if nvm is installed');
  try {
    execSync('. "$NVM_DIR/nvm.sh" && nvm --version', { stdio: 'ignore' });
    logChild('nvm is installed');
  } catch (_) {
    logChild('[ERR] nvm is not installed');
  }

  logBase('checking to see if pm2 is installed');
  try {
    execSync('pm2 --version', { stdio: 'ignore' });
    logChild('pm2 is installed');
  } catch (_) {
    logChild('[ERR] pm2 is not installed');
  }

  const homeDir = os.homedir();
  const kolonyDir = path.join(homeDir, './.kolony');
  const sitesEnabledDir = path.join(kolonyDir, 'sites-enabled');

  logBase('looking for kolony dir');
  if (!fs.existsSync(kolonyDir)) {
    fs.mkdirSync(kolonyDir);
    logChild('created folder');
  } else {
    logChild('found folder');
  }

  logBase('looking for domains dir');
  if (!fs.existsSync(sitesEnabledDir)) {
    fs.mkdirSync(sitesEnabledDir);
    logChild('created folder');
  } else {
    logChild('found folder');
  }
};

module.exports.command = 'setup';
module.exports.desc = 'setup kolony';

module.exports.handler = (args) => {
  setup(args).catch((err) => {
    console.log(` [ERR] ${err}`);
    process.exit(1);
  });
};
