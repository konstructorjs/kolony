const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const { logBase, logChild, logError } = require('../utils/logger');
const config = require('../utils/config');
const run = require('../utils/run');
const dirs = require('../utils/dirs');

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
  const appDir = path.join(dirs.kolony, name);
  const homeLink = path.join(dirs.home, name);
  let app;
  logBase('looking for application');
  try {
    app = await config.getMetadata(name);
  } catch (err) {
    throw new Error('cannot find application');
  }
  if (!fs.existsSync(appDir)) {
    throw new Error('cannot find application');
  } else {
    logChild('found application');
  }

  logBase('removing application process');
  if (app.pm2 && app.pm2.name) {
    await run(`pm2 stop ${app.pm2.name}`);
    await run(`pm2 delete ${app.pm2.name}`);
    logChild('removed application process');
  } else {
    logChild('application not running');
  }

  logBase('removing links');
  if (fs.existsSync(homeLink)) {
    fs.unlinkSync(homeLink);
    logChild('unlinked files');
  }

  logBase('removing app directory');
  if (fs.existsSync(appDir)) {
    await rmDir(appDir);
    logChild('removed app directory');
  } else {
    logChild('app directory does not exist');
  }


  await config.setMetadata(undefined, name);

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
    logError(`${err}`);
    process.exit(1);
  });
};
