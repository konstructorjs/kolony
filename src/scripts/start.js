const chalk = require('chalk');
const os = require('os');
const path = require('path');
const bs58 = require('bs58');
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

const start = async (args) => {
  const homeDir = os.homedir();
  const kolonyDir = path.join(homeDir, './.kolony');
  const name = args.name;
  const gitDir = path.join(kolonyDir, name);
  const projectsDir = path.join(kolonyDir, './projects');
  const projectDir = path.join(projectsDir, name);
  const kolonyFile = path.join(kolonyDir, './kolony.json');

  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir);
  }

  process.chdir(projectsDir);

  process.env.GIT_DIR = '.git';
  if (fs.existsSync(projectDir)) {
    process.chdir(projectDir);
    execSync('git pull origin master');
  } else {
    execSync(`git clone ${gitDir} ${name}`);
  }

  process.chdir(projectDir);

  let oldID;
  let kolonyData;
  try {
    kolonyData = require(kolonyFile);
    oldID = kolonyData[name].id;
  } catch (_) {
    kolonyData = {};
    oldID = undefined;
  }
  const newID = bs58.encode(crypto.randomBytes(4));

  let packageJSON;
  try {
    packageJSON = require(path.join(projectDir, './package.json'));
  } catch (err) {
    throw new Error('unable to find package.json');
  }

  let nodeVersion = 'stable';
  let npmVersion;

  if (packageJSON.engines) {
    nodeVersion = packageJSON.engines.node || 'stable';
    npmVersion = packageJSON.engines.npm;
  }

  execSync(`. "$NVM_DIR/nvm.sh" && nvm install ${nodeVersion}`);

  if (npmVersion) execSync(`. "$NVM_DIR/nvm.sh" && nvm exec ${nodeVersion} npm install -g npm@${npmVersion}`);

  process.env.NODE_ENV = 'production';
  process.env.NPM_CONFIG_LOGLEVEL = 'error';
  process.env.NPM_CONFIG_PRODUCTION = 'false';
  process.env.NODE_VERBOSE = 'false';

  execSync(`. "$NVM_DIR/nvm.sh" && nvm exec ${nodeVersion} npm install`);

  execSync(`. "$NVM_DIR/nvm.sh" && nvm exec ${nodeVersion} npm run build`);

  execSync(`pm2 start --interpreter=$(. "$NVM_DIR/nvm.sh" && nvm which ${nodeVersion}) --name ${name}-${newID} npm -- start`);

  const data = {
    id: newID,
  };
  kolonyData[name] = data;

  fs.writeFileSync(kolonyFile, JSON.stringify(kolonyData, null, 2));

  if (oldID) {
    execSync(`pm2 stop ${name}-${oldID}`);
    execSync(`pm2 delete ${name}-${oldID}`);
  }
};

module.exports.command = 'start <name>';
module.exports.desc = false;
module.exports.builder = {
  name: {
    describe: 'the name of the server block',
  },
};

module.exports.handler = (args) => {
  start(args).catch((err) => {
    console.log(chalk.red(err));
    process.exit(1);
  });
};
