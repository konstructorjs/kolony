const os = require('os');
const path = require('path');
const bs58 = require('bs58');
const fs = require('fs');
const crypto = require('crypto');
const { logBase, logChild } = require('../utils/logger.js');
const config = require('../utils/config');
const ports = require('../utils/ports');
const run = require('../utils/run');

const build = async (args) => {
  const homeDir = os.homedir();
  const kolonyDir = path.join(homeDir, './.kolony');
  const name = args.name;
  const gitDir = path.join(kolonyDir, name);
  const projectsDir = path.join(kolonyDir, './projects');
  const projectDir = path.join(projectsDir, name);

  if (!fs.existsSync(projectsDir)) {
    throw new Error('unable to find kolony directory. please run kolony setup');
  }

  process.chdir(projectsDir);

  process.env.GIT_DIR = '.git';
  logBase('fetching updates');
  if (fs.existsSync(projectDir)) {
    process.chdir(projectDir);
    logChild('cleaning temporary files');
    run('git reset --hard HEAD');
    run('git clean -f');
    logChild('pulling updates');
    run('git pull origin master');
  } else {
    logChild('cloning project');
    run(`git clone ${gitDir} ${name}`);
  }

  process.chdir(projectDir);

  console.log(`> checking the status of ${name}`);
  const kolonyData = await config.getConfig();
  const oldID = (kolonyData[name]) ? kolonyData[name].id : undefined;

  let port;
  if (kolonyData[name] && kolonyData[name].port) {
    port = kolonyData[name].port;
    logChild(`found existing port ${port}`);
  } else {
    logChild('could not find existing port');
    let done = false;
    while (!done) {
      port = ports.randomPort();
      const result = Object.keys(kolonyData).filter(obj => obj.port === port); // eslint-disable-line
      if (ports.checkPort(port) && result.length === 0) {
        done = true;
      }
    }
    logChild(`generated new port ${port}`);
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

  process.env.PORT = port;
  process.env.NODE_ENV = 'production';
  process.env.NPM_CONFIG_LOGLEVEL = 'error';
  process.env.NPM_CONFIG_PRODUCTION = 'false';
  process.env.NODE_VERBOSE = 'false';

  logBase('installing packages');
  run(`nvm exec --silent ${nodeVersion} npm install | sed 's/^/\t/'`, { show: true });

  logBase('cleaning assets');
  run(`nvm exec --silent ${nodeVersion} npm run clean | sed 's/^/\t/'`, { show: true });

  logBase('building assets');
  run(`nvm exec --silent ${nodeVersion} npm run build | sed 's/^/\t/'`, { show: true });

  logBase('digesting assets');
  run(`nvm exec --silent ${nodeVersion} npm run digest | sed 's/^/\t/'`, { show: true });

  logBase('starting server');
  run(`pm2 start --interpreter=$(. "$NVM_DIR/nvm.sh" && nvm which ${nodeVersion}) --name ${name}-${newID} npm -- start`);
  logChild(`started server on port ${port}`);

  const data = {
    port,
    id: newID,
  };
  kolonyData[name] = data;

  logBase('saving new project status');
  await config.setConfig(kolonyData);

  if (oldID) {
    logBase('deleting old project instance');
    try {
      run(`pm2 stop ${name}-${oldID}`);
      run(`pm2 delete ${name}-${oldID}`);
    } catch (_) {
      logChild('there was a problem shutting down your older server. please do it manually');
    }
  }
  logBase('DONE!');
};

module.exports.command = 'build <name>';
module.exports.desc = false;
module.exports.builder = {
  name: {
    describe: 'the name of the server block',
  },
};

module.exports.handler = (args) => {
  build(args).catch((err) => {
    console.log(`${err}`);
    process.exit(1);
  });
};
