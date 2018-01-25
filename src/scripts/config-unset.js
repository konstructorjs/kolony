const path = require('path');
const fs = require('fs');

const { logBase, logChild, logError } = require('../utils/logger');
const run = require('../utils/run');
const config = require('../utils/config');
const dirs = require('../utils/dirs');

const unset = async (args) => {
  const name = args.name;
  logBase('looking for application');

  const app = await config.getMetadata(name);
  logChild(`found application ${name}`);

  logBase('processing environment variables');
  const keys = [];
  keys.push(args.keys);
  if (args._.length > 1) {
    const extraKeys = args._;
    extraKeys.shift();
    extraKeys.forEach(key => keys.push(key));
  }

  logChild(`removing ${keys.length} environment variables`);
  const env = app.env || {};
  keys.forEach((key) => {
    try {
      delete env[key];
    } catch (_) {
      throw new Error(`unable to remove key ${key}`);
    }
  });

  app.env = env;
  await config.setMetadata(app, name);
  logChild('removed environment variables');

  if (app.cwd) {
    logBase('restarting application');

    const appDir = path.join(dirs.kolony, name);
    const metadataDir = path.join(appDir, './metadata');
    const ecosystemPath = path.join(metadataDir, './ecosystem.json');
    let ecosystem;
    try {
      ecosystem = require(ecosystemPath);
      ecosystem = ecosystem.apps[0];
    } catch (err) {
      throw new Error('unable to load ecosystem file');
    }
    ecosystem.env = app.env;

    const ecosystemWrite = {
      apps: [
        ecosystem,
      ],
    };

    fs.writeFileSync(ecosystemPath, JSON.stringify(ecosystemWrite, null, 2));
    run(`pm2 reload ${ecosystemPath} --update-env`);
    logChild('app restarted successfully');
  }

  logBase('successfully removed the following environment variables');
  keys.forEach((key) => {
    logChild(key);
  });

  console.log();
};

module.exports.command = 'config:unset <name> <keys>';
module.exports.desc = 'unset environment variables for app';
module.exports.builder = {
  name: {
    describe: 'the name of the application',
  },
  keys: {
    describe: 'the keys of the environment variables you would like to remove',
  },
};

module.exports.handler = (args) => {
  unset(args).catch((err) => {
    logError(`${err}`);
    process.exit(1);
  });
};
