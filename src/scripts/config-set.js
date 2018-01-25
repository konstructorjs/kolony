const path = require('path');
const fs = require('fs');

const { logBase, logChild, logError } = require('../utils/logger');
const run = require('../utils/run');
const config = require('../utils/config');
const dirs = require('../utils/dirs');

const set = async (args) => {
  const name = args.name;
  logBase('looking for application');

  const app = await config.getMetadata(name);
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
  await config.setMetadata(app, name);
  logChild('added environment variables');

  if (app.pm2 && app.pm2.name) {
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
