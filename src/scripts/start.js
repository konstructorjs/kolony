const chalk = require('chalk');
const os = require('os');
const path = require('path');
const bs58 = require('bs58');
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

const run = (command, inputOptions) => {
  const options = inputOptions || {};
  let builder = '';
  if (command.split(' ')[0] === 'nvm' || options.nvm) {
    builder += '. "$NVM_DIR/nvm.sh" && ';
  }
  builder += command;
  const execOptions = {
    stdio: (options.show) ? 'inherit' : 'ignore',
  };
  execSync(builder, execOptions);
};

const logBase = (message) => {
  console.log(`> ${message}`);
};

const logChild = (message) => {
  console.log(`\t${message}`);
};

const start = async (args) => {
  console.log('/*');
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
  logBase('fetching updates');
  if (fs.existsSync(projectDir)) {
    process.chdir(projectDir);
    logChild('pulling updates');
    run('git pull origin master');
  } else {
    logChild('cloning project');
    run(`git clone ${gitDir} ${name}`);
  }

  process.chdir(projectDir);

  console.log(`> checking the status of ${name}`);
  let oldID;
  let kolonyData;
  try {
    kolonyData = require(kolonyFile);
    oldID = kolonyData[name].id;
  } catch (_) {
    kolonyData = {};
    oldID = undefined;
  }
  if (oldID) {
    logChild(`found existing project id ${oldID}`);
  } else {
    logChild('couldnt not find existing project');
  }
  const newID = bs58.encode(crypto.randomBytes(4));
  logChild(`generated new project id ${newID}`);

  logBase('looking for package.json');
  let packageJSON;
  try {
    packageJSON = require(path.join(projectDir, './package.json'));
  } catch (err) {
    throw new Error('\t unable to find package.json');
  }
  logChild('found package.json');

  logBase('looking for node and npm versions');
  let nodeVersion = 'stable';
  let npmVersion;

  if (packageJSON.engines) {
    nodeVersion = packageJSON.engines.node || 'stable';
    npmVersion = packageJSON.engines.npm;
  }

  logChild(`installing node ${nodeVersion}`);
  run(`nvm install ${nodeVersion}`);

  if (npmVersion) {
    logChild(`installing npm ${npmVersion}`);
    run(`nvm exec ${nodeVersion} npm install -g npm@${npmVersion}`);
  }

  process.env.NODE_ENV = 'production';
  process.env.NPM_CONFIG_LOGLEVEL = 'error';
  process.env.NPM_CONFIG_PRODUCTION = 'false';
  process.env.NODE_VERBOSE = 'false';

  logBase('installing packages');
  run(`nvm exec --silent ${nodeVersion} npm install | sed 's/^/\t/'`, { show: true });

  logBase('building assets');
  run(`nvm exec --silent ${nodeVersion} npm run build | sed 's/^/\t/'`, { show: true });

  logBase('starting server');
  run(`pm2 start --interpreter=$(. "$NVM_DIR/nvm.sh" && nvm which ${nodeVersion}) --name ${name}-${newID} npm -- start`);

  const data = {
    id: newID,
  };
  kolonyData[name] = data;

  logBase('saving new project status');
  fs.writeFileSync(kolonyFile, JSON.stringify(kolonyData, null, 2));

  if (oldID) {
    logBase('deleting old project instance');
    run(`pm2 stop ${name}-${oldID}`);
    run(`pm2 delete ${name}-${oldID}`);
  }
  logBase('DONE!');
  console.log('*/');
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
