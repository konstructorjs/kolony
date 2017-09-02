const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const { logBase, logChild } = require('../utils/logger');
const config = require('../utils/config');
const dirs = require('../utils/dirs');
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

const destroy = async (args) => {
  const name = args.name;
  const gitDir = path.join(dirs.git, name);
  const ecosystemPath = path.join(dirs.ecosystems, `${name}.json`);
  const homeLink = path.join(dirs.home, name);

  logBase('looking for application');
  if (!dirs.gitExists(name)) {
    throw new Error('cannot find application');
  } else {
    logChild('found application');
  }

  let app;
  try {
    const ecosystem = await config.getEcosystem(name);
    app = ecosystem.apps[0];
  } catch (_) {
    app = {};
  }

  logBase('removing application process');
  if (app.cwd) {
    run(`pm2 stop ${ecosystemPath}`);
    run(`pm2 delete ${ecosystemPath}`);
    logChild('removed application process');
  } else {
    logChild('application not running');
  }

  logBase('removing project build directory');
  if (app.cwd && fs.existsSync(app.cwd)) {
    await rmDir(app.cwd);
    logChild('removed project directory');
  } else {
    logChild('build directory does not exist');
  }

  logBase('removing links');
  if (fs.existsSync(homeLink)) {
    fs.unlinkSync(homeLink);
    logChild('unlinked files');
  }

  logBase('removing git directory');
  if (fs.existsSync(gitDir)) {
    await rmDir(gitDir);
    logChild('git directory removed');
  } else {
    logChild('git directory does not exist');
  }

  logBase('removing ecosystem config');
  if (fs.existsSync(ecosystemPath)) {
    fs.unlinkSync(ecosystemPath);
    logChild('removed ecosystem config');
  } else {
    logChild('ecosystem config does not exist');
  }

  console.log();
};

module.exports.command = 'apps:destroy <name>';
module.exports.desc = 'destroy an application';
module.exports.builder = {
  name: {
    describe: 'the name of the application',
  },
};
module.exports.handler = (args) => {
  destroy(args).catch((err) => {
    console.log(`${err}`);
    process.exit(1);
  });
};
