const fs = require('fs');
const path = require('path');
const bs58 = require('bs58');
const crypto = require('crypto');
const ncp = require('ncp').ncp;
// const rimraf = require('rimraf');
const { exec } = require('pkg');

const check = require('../utils/check');
const dirs = require('../utils/dirs');
const { logBase, logChild } = require('../utils/logger.js');
const config = require('../utils/config');
const ports = require('../utils/ports');
const run = require('../utils/run');

// const rmDir = dirPath => new Promise((resolve, reject) => {
//   rimraf(dirPath, (err) => {
//     if (err) {
//       reject(err);
//     } else {
//       resolve();
//     }
//   });
// });

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
  // const ecosystemPath = path.join(dirs.ecosystems, `${name}.json`);

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
    if (oldAppName !== 'builds') {
      const oldAppNameSplit = oldAppName.split('-');
      oldID = oldAppNameSplit[oldAppNameSplit.length - 1];
    }
  }
  const newID = bs58.encode(crypto.randomBytes(4));
  logBase(`building application ${newID}`);

  process.chdir(dirs.sources);
  process.env.GIT_DIR = '.git';

  logBase('cloning application');
  run(`git clone ${gitDir} ${name}-${newID}`);

  const sourceDir = path.join(dirs.sources, `${name}-${newID}`);
  app.cwd = sourceDir;
  app.name = `${name}-${newID}`;
  process.chdir(sourceDir);

  logBase('looking for existing build');
  if (oldID) {
    logChild(`found existing build id ${oldID}`);
    logChild('copying node_modules from old build');
    await copyDir(path.join(dirs.sources, `./${name}-${oldID}`, './node_modules'), path.join(sourceDir, './node_modules'));
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
    packageJSON = require(path.join(sourceDir, './package.json'));
  } catch (err) {
    throw new Error('\t unable to find package.json');
  }
  logChild('found package.json');

  logBase('detecting config settings');
  let nodeVersion;
  if (packageJSON.engines && packageJSON.engines.node) {
    nodeVersion = packageJSON.engines.node || 'stable';
    logChild(`found node version ${nodeVersion}`);
  }

  let konstructor;
  if (packageJSON.dependencies && packageJSON.dependencies.konstructor) {
    konstructor = true;
    logChild('detected a konstructor application');
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

  let stages = {};
  if (konstructor) {
    packageJSON.bin = 'node_modules/konstructor/app.js';
    packageJSON.pkg = {
      scripts: [
        './node_modules/konstructor/**/*.js',
        './app/**/*.js',
        './db/**/*.js',
        './config/**/*.js',
        '*.js',
      ],
      assets: [
        './node_modules/konstructor-essentials/**/*.marko',
        './node_modules/konstructor-essentials/**/*.scss',
        './node_modules/konstructor-essentials/**/*.js',
        'public/**/*',
      ],
    };
    fs.writeFileSync(path.join(sourceDir, './package.json'), JSON.stringify(packageJSON), 'utf8');
    stages['post-install'] = 'npm run build';
    stages['pre-build'] = 'npm prune';
    stages.build = '';
    stages.pkg = true;
  }
  stages = Object.assign({}, stages, packageJSON.kolony);

  run('nvm use node');
  const runScript = (scriptName, command) => {
    logBase(`running ${scriptName} script`);
    if (command) {
      run(`nvm exec --silent node ${command} | sed 's/^/\t/'`, { show: true });
    } else {
      logChild(`no ${scriptName} script defined`);
    }
  };

  const preInstallScript = stages['pre-install'];
  runScript('pre-install', preInstallScript);

  const installScript = stages.install || 'npm install';
  runScript('install', installScript);

  const postInstallScript = stages['post-install'];
  runScript('post-install', postInstallScript);

  const preBuildScript = stages['pre-build'];
  runScript('pre-build', preBuildScript);

  const buildScript = stages.build || 'npm run build';
  runScript('build', buildScript);
  if (stages.pkg && !stages.build) {
    logBase('running build script');
    await exec(['.', '--target', 'host', '--output', 'output']);
  }

  const postBuildScript = stages['post-build'];
  runScript('post-build', postBuildScript);

  // logBase('starting server');

  // run(`pm2 start --interpreter=$(. "$NVM_DIR/nvm.sh"
  //   && nvm which ${nodeVersion}) --name ${name}-${newID} ${ecosystemPath}`);

  // logChild(`started server on port ${port}`);

  // logBase('saving process in pm2');
  // run('pm2 save');
  // logChild('process is saved');

  // if (oldID) {
  //   logBase('deleting old project instance');
  //   try {
  //     run(`pm2 stop ${name}-${oldID}`);
  //     run(`pm2 delete ${name}-${oldID}`);
  //     await rmDir(path.join(dirs.sources, `./${name}-${oldID}`));
  //   } catch (_) {
  //     logChild('there was a problem shutting down your older server. please do it manually');
  //   }
  // }

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
