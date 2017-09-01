const { logBase, logChild } = require('../utils/logger');
const config = require('../utils/config');

const remove = async (args) => {
  const name = args.name;

  const kolonyData = await config.getConfig();
  const project = kolonyData[name];
  if (project) {
    logChild(`found ${name}`);
  } else {
    throw new Error('could not find application. please push before you add a domain');
  }

  const variable = args.variable.split('=');
  if (variable.length !== 2) {
    throw new Error('invalid environment variable argument');
  }

  logBase('looking for environment variables');
  const variables = project.envVariables || {};
  if (Object.keys(variables).length !== 0) {
    logChild('found existing variables');
  } else {
    logChild('no existing variables set');
  }

  logBase(`adding variable ${variable[0]}`);
  variables[variable[0]] = variable[1];
  project.envVariables = variables;
  kolonyData[name] = project;
  await config.setConfig(kolonyData);
  logChild('updated application information');
};

module.exports.command = 'config:set <name> <variable>';
module.exports.desc = 'set environment variables for the application';
module.exports.builder = {
  name: {
    describe: 'application name',
  },
  variable: {
    describe: 'environment variable',
  },
};

module.exports.handler = (args) => {
  remove(args).catch((err) => {
    console.log(`${err}`);
    process.exit(1);
  });
};
