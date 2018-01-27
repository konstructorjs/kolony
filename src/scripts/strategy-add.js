const { logBase, logChild, logError } = require('../utils/logger');
const config = require('../utils/config');

const add = async (args) => {
  const name = args.name;
  const strategy = args.strategy;
  logBase('looking for application');

  const app = await config.getMetadata(name);
  logChild(`found application ${name}`);

  logBase('adding strategy to app');
  app.strategy = strategy;
  await config.setMetadata(app, name);
  logChild('added strategy to app');

  console.log();
};

module.exports.command = 'strategy:set <name> <strategy>';
module.exports.desc = 'set strategy for app';
module.exports.builder = {
  name: {
    describe: 'the name of the application',
  },
  variables: {
    describe: 'the github url for the strategy',
  },
};

module.exports.handler = (args) => {
  add(args).catch((err) => {
    logError(`${err}`);
    process.exit(1);
  });
};
