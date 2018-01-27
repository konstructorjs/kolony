const { logBase, logChild, logError } = require('../utils/logger');
const config = require('../utils/config');

const remove = async (args) => {
  const name = args.name;
  logBase('looking for application');

  const app = await config.getMetadata(name);
  logChild(`found application ${name}`);

  logBase('removing strategy from app');
  delete app.strategy;
  await config.setMetadata(app, name);
  logChild('removed strategy from app');

  console.log();
};

module.exports.command = 'strategy:remove <name> <strategy>';
module.exports.desc = 'remove strategy from app';
module.exports.builder = {
  name: {
    describe: 'the name of the application',
  },
  variables: {
    describe: 'the github url for the strategy',
  },
};

module.exports.handler = (args) => {
  remove(args).catch((err) => {
    logError(`${err}`);
    process.exit(1);
  });
};
