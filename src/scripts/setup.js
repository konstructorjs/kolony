const chalk = require('chalk');
const { execSync } = require('child_process');

const setup = async () => {
  console.log(chalk.bgBlue(chalk.black(' checking to see if git is installed. ')));
  try {
    execSync('git --version');
    console.log(chalk.bgGreen(chalk.black('\t git is installed. ')));
  } catch (_) {
    console.log(chalk.bgRed(chalk.black('\t git is not installed. ')));
  }

  console.log(chalk.bgBlue(chalk.black(' checking to see if nvm is installed. ')));
  try {
    execSync('. "$NVM_DIR/nvm.sh" && nvm --version');
    console.log(chalk.bgGreen(chalk.black('\t nvm is installed. ')));
  } catch (_) {
    console.log(chalk.bgRed(chalk.black('\t nvm is not installed. ')));
  }

  console.log(chalk.bgBlue(chalk.black(' checking to see if pm2 is installed. ')));
  try {
    execSync('pm2 --version');
    console.log(chalk.bgGreen(chalk.black('\t pm2 is installed. ')));
  } catch (_) {
    console.log(chalk.bgRed(chalk.black('\t pm2 is not installed. ')));
  }
};

module.exports.command = 'setup';
module.exports.desc = 'setup kolony';

module.exports.handler = (args) => {
  setup(args).catch((err) => {
    console.log(chalk.red(err));
  });
};
