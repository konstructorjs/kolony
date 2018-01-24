const path = require('path');

const { logBase, logChild, logError } = require('../utils/logger');
const run = require('../utils/run');
const config = require('../utils/config');
const dirs = require('../utils/dirs');

const unset = async (args) => {
  const name = args.name;
  logBase('looking for application');

  const ecosystem = await config.getEcosystem(name);
  if (!ecosystem) {
    throw new Error('unable to find ecosystem');
  }
  const app = ecosystem.apps[0];
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
  ecosystem.apps = [app];
  await config.setEcosystem(name, ecosystem);
  logChild('removed environment variables');

  if (app.cwd) {
    logBase('restarting application');
    const ecosystemPath = path.join(dirs.ecosystems, `${name}.json`);
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
