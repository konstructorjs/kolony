const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const { logBase, logChild, logError } = require('../utils/logger');
const config = require('../utils/config');
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
  const metadata = await config.getMetadata();
  const appDir = path.join(dirs.kolony, name);
  const homeLink = path.join(dirs.home, name);

  logBase('looking for application');
  if (!metadata[name] && !fs.existsSync(appDir)) {
    throw new Error('cannot find application');
  } else {
    logChild('found application');
  }

  // logBase('removing application process');
  // if (app.cwd) {
  //   run(`pm2 stop ${ecosystemPath}`);
  //   run(`pm2 delete ${ecosystemPath}`);
  //   logChild('removed application process');
  // } else {
  //   logChild('application not running');
  // }

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

  delete metadata[name];
  await config.setMetadata(metadata);

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
