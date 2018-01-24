const fs = require('fs');
const path = require('path');
const kopy = require('kopy');
const { execSync } = require('child_process');

const check = require('../utils/check');
const dirs = require('../utils/dirs');
const { logBase, logChild, logError } = require('../utils/logger');
const config = require('../utils/config');

const create = async (args) => {
  check.setup();

  logBase('validating name');
  const name = args.name;
  if (/[^a-z-]/gi.test(name)) {
    throw new Error('name must only contain lowercase letters and dashes');
  }

  logBase('creating app directories');
  const appDir = path.join(dirs.kolony, name);
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir);
    logChild('created app directory');
  } else {
    throw new Error('app directory already exists');
  }

  const gitDir = path.join(appDir, './git');
  if (!fs.existsSync(gitDir)) {
    fs.mkdirSync(gitDir);
    logChild('created git directory');
  } else {
    throw new Error('git directory already exists');
  }

  const buildsDir = path.join(appDir, './builds');
  if (!fs.existsSync(buildsDir)) {
    fs.mkdirSync(buildsDir);
    logChild('created builds directory');
  } else {
    throw new Error('build directory already exists');
  }

  const metadataDir = path.join(appDir, './metadata');
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir);
    logChild('created metadata directory');
  } else {
    throw new Error('metadata directory already exists');
  }

  logBase('creating git repository');
  process.chdir(gitDir);
  execSync('git init --bare', {
    cwd: gitDir,
  });
  logChild('initialized git repository');

  logBase('linking files');
  const homeLink = path.join(dirs.home, name);
  if (fs.existsSync(homeLink)) {
    throw new Error(`${homeLink} exists. please remove it and try again`);
  }
  fs.symlinkSync(gitDir, homeLink);
  logChild('linked git repository to the home directory');

  logBase('setting up git hooks');
  const blueprintsDir = path.join(__dirname, '../../blueprints');
  await kopy(path.join(blueprintsDir, './post-receive'), path.join(gitDir, './hooks'), {
    data: {
      name,
    },
  });
  execSync(`chmod ug+x ${path.join(gitDir, './hooks/post-receive')}`, {
    cwd: gitDir,
  });
  logChild('set up git hooks');

  logBase('set up metadata');
  await kopy(path.join(blueprintsDir, './ecosystem'), metadataDir, {
    data: {
      name,
      script: 'npm',
      args: 'start',
    },
  });
  logChild('created pm2 config');
  const metadata = await config.getMetadata() || {};
  metadata[name] = {
    name,
    path: appDir,
    env: {},
  };
  await config.setMetadata(metadata);
  logChild('updated metadata');

  console.log();
};

module.exports.command = 'apps:create <name>';
module.exports.desc = 'create a new application';
module.exports.builder = {
  name: {
    describe: 'the name of the application',
  },
};
module.exports.handler = (args) => {
  create(args).catch((err) => {
    logError(`${err}`);
    console.log();
    process.exit(1);
  });
};
