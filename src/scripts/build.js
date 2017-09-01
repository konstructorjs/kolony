const path = require('path');
const bs58 = require('bs58');
const crypto = require('crypto');
const ncp = require('ncp').ncp;
const rimraf = require('rimraf');

const check = require('../utils/check');
const dirs = require('../utils/dirs');
const { logBase, logChild } = require('../utils/logger.js');
const config = require('../utils/config');
const ports = require('../utils/ports');
const run = require('../utils/run');

const rmDir = dirPath => new Promise((resolve, reject) => {
  rimraf(dirPath, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});

const copyDir = (source, destination) => new Promise((resolve, reject) => {
  ncp(source, destination, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});

const build = async (args) => {
  check.setup();

  const name = args.name;
  const gitDir = path.join(dirs.git, name);
  const ecosystemPath = path.join(dirs.ecosystems, `${name}.json`);

  let ecosystem;
  let app;
  try {
    ecosystem = await config.getEcosystem(name);
    app = ecosystem.apps[0];
  } catch (_) {
    ecosystem = {};
    app = {};
  }

  let oldID;
  if (app.cwd) {
    const splitPath = app.cwd.split('/');
    const oldAppName = splitPath[splitPath.length - 1];
    const oldAppNameSplit = oldAppName.split('-');
    oldID = oldAppNameSplit[oldAppNameSplit.length - 1];
  }
  const newID = bs58.encode(crypto.randomBytes(4));
  logBase(`building application ${newID}`);

  process.chdir(dirs.builds);
  process.env.GIT_DIR = '.git';

  logBase('cloning application');
  run(`git clone ${gitDir} ${name}-${newID}`);

  const buildDir = path.join(dirs.builds, `${name}-${newID}`);
  app.cwd = buildDir;
  app.name = `${name}-${newID}`;
  process.chdir(buildDir);

  logBase('looking for existing build');
  if (oldID) {
    logChild(`found existing build id ${oldID}`);
    logChild('copying node_modules from old build');
    await copyDir(path.join(dirs.builds, `./${name}-${oldID}`, './node_modules'), path.join(buildDir, './node_modules'));
  } else {
    logChild('couldnt not find existing build');
  }

  console.log();

  let port;
  if (app.port) {
    port = app.port;
    logChild(`found existing port ${port}`);
  } else {
    logChild('could not find existing port');
    let done = false;
    while (!done) {
      port = ports.randomPort();
      if (ports.checkPort(port)) {
        done = true;
      }
    }
    app.port = port;
    logChild(`generated new port ${port}`);
  }

  logBase('looking for package.json');
  let packageJSON;
  try {
    packageJSON = require(path.join(buildDir, './package.json'));
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

  logBase('configuring environment variables');
  const env = app.env || {};
  env.PORT = port;
  env.NODE_ENV = env.NODE_ENV || 'production';
  env.NPM_CONFIG_LOGLEVEL = env.NPM_CONFIG_LOGLEVEL || 'error';
  env.NPM_CONFIG_PRODUCTION = env.NPM_CONFIG_PRODUCTION || 'false';
  env.NODE_VERBOSE = env.NODE_VERBOSE || 'false';
  Object.keys(env).forEach((key) => {
    const value = env[key];
    process.env[key] = value;
  });

  app.env = env;
  ecosystem.apps = [app];
  await config.setEcosystem(name, ecosystem);

  logBase('installing packages');
  run(`nvm exec --silent ${nodeVersion} npm install | sed 's/^/\t/'`, { show: true });

  logBase('cleaning assets');
  run(`nvm exec --silent ${nodeVersion} npm run clean | sed 's/^/\t/'`, { show: true });

  logBase('building assets');
  run(`nvm exec --silent ${nodeVersion} npm run build | sed 's/^/\t/'`, { show: true });

  logBase('digesting assets');
  run(`nvm exec --silent ${nodeVersion} npm run digest | sed 's/^/\t/'`, { show: true });

  logBase('starting server');
  run(`pm2 start --interpreter=$(. "$NVM_DIR/nvm.sh" && nvm which ${nodeVersion}) --name ${name}-${newID} ${ecosystemPath}`);
  logChild(`started server on port ${port}`);

  if (oldID) {
    logBase('deleting old project instance');
    try {
      run(`pm2 stop ${name}-${oldID}`);
      run(`pm2 delete ${name}-${oldID}`);
      await rmDir(path.join(dirs.builds, `./${name}-${oldID}`));
    } catch (_) {
      logChild('there was a problem shutting down your older server. please do it manually');
    }
  }

  logBase('application successfully deployed');
  console.log();
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
