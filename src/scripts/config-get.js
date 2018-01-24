require('console.table');

const { logError } = require('../utils/logger');
const config = require('../utils/config');

const list = async (args) => {
  const name = args.name;

  const table = [];
  const app = await config.getMetadata(name);
  try {
    const env = app.env || {};
    Object.keys(env).forEach((key) => {
      const value = env[key];
      table.push({
        key,
        value,
      });
    });
  } catch (err) {
    throw new Error('error getting environment variables');
  }
  console.log();
  console.table(table);
};

module.exports.command = 'config:get <name>';
module.exports.desc = 'list all environment variables for app';
module.exports.builder = {
  name: {
    describe: 'the name of the application',
  },
};

module.exports.handler = (args) => {
  list(args).catch((err) => {
    logError(`${err}`);
    process.exit(1);
  });
};
