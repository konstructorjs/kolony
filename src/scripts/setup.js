const chalk = require('chalk');
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const setup = async () => {
  console.log(chalk.bgBlue(chalk.black(' checking to see if git is installed. ')));
  try {
    execSync('git --version', { stdio: 'ignore' });
    console.log(chalk.bgGreen(chalk.black('\t git is installed. ')));
  } catch (_) {
    console.log(chalk.bgRed(chalk.black('\t git is not installed. ')));
  }

  console.log(chalk.bgBlue(chalk.black(' checking to see if nginx is installed. ')));
  try {
    execSync('nginx -v', { stdio: 'ignore' });
    console.log(chalk.bgGreen(chalk.black('\t nginx is installed. ')));
  } catch (_) {
    console.log(chalk.bgRed(chalk.black('\t nginx is not installed. ')));
  }

  console.log(chalk.bgBlue(chalk.black(' checking to see if nvm is installed. ')));
  try {
    execSync('. "$NVM_DIR/nvm.sh" && nvm --version', { stdio: 'ignore' });
    console.log(chalk.bgGreen(chalk.black('\t nvm is installed. ')));
  } catch (_) {
    console.log(chalk.bgRed(chalk.black('\t nvm is not installed. ')));
  }

  console.log(chalk.bgBlue(chalk.black(' checking to see if pm2 is installed. ')));
  try {
    execSync('pm2 --version', { stdio: 'ignore' });
    console.log(chalk.bgGreen(chalk.black('\t pm2 is installed. ')));
  } catch (_) {
    console.log(chalk.bgRed(chalk.black('\t pm2 is not installed. ')));
  }

  const homeDir = os.homedir();
  const kolonyDir = path.join(homeDir, './.kolony');
  const sitesEnabledDir = path.join(kolonyDir, 'sites-enabled');

  if (!fs.existsSync(kolonyDir)) {
    fs.mkdirSync(kolonyDir);
  }

  if (!fs.existsSync(sitesEnabledDir)) {
    fs.mkdirSync(sitesEnabledDir);
  }
};

module.exports.command = 'setup';
module.exports.desc = 'setup kolony';

module.exports.handler = (args) => {
  setup(args).catch((err) => {
    console.log(chalk.red(err));
  });
};
