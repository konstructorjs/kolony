const path = require('path');

const { logBase, logChild, logError } = require('../utils/logger');
const run = require('../utils/run');
const config = require('../utils/config');
const dirs = require('../utils/dirs');

const set = async (args) => {
  const name = args.name;
  logBase('looking for application');

  const ecosystem = await config.getEcosystem(name);
  if (!ecosystem) {
    throw new Error('unable to find ecosystem');
  }
  const app = ecosystem.apps[0];
  logChild(`found application ${name}`);

  logBase('processing environment variables');
  const variables = [];
  variables.push(args.variables);
  if (args._.length > 1) {
    const extraVariables = args._;
    extraVariables.shift();
    extraVariables.forEach(variable => variables.push(variable));
  }

  logChild(`adding ${variables.length} environment variables`);
  const env = app.env || {};
  variables.forEach((variable) => {
    const arr = variable.split('=');
    const key = arr[0];
    const value = arr[1];
    if (arr.length !== 2) {
      throw new Error(`invalid environment variable argument ${variable}`);
    }
    env[key] = value;
  });

  app.env = env;
  ecosystem.apps = [app];
  await config.setEcosystem(name, ecosystem);
  logChild('added environment variables');

  if (app.cwd) {
    logBase('restarting application');
    const ecosystemPath = path.join(dirs.ecosystems, `${name}.json`);
    run(`pm2 reload ${ecosystemPath} --update-env`);
    logChild('app restarted successfully');
  }

  logBase('successfully added the following environment variables');
  variables.forEach((variable) => {
    logChild(variable);
  });

  console.log();
};

module.exports.command = 'config:set <name> <variables>';
module.exports.desc = 'set environment variables for app';
module.exports.builder = {
  name: {
    describe: 'the name of the application',
  },
  variables: {
    describe: 'the environment variables you would like to add',
  },
};

module.exports.handler = (args) => {
  set(args).catch((err) => {
    logError(`${err}`);
    process.exit(1);
  });
};
