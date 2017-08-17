const chalk = require('chalk');

const create = async (args) => {
  console.log(args);
};

module.exports.command = 'new <name>';
module.exports.desc = 'create a new server block';
module.exports.builder = {
  name: {
    describe: 'the name of the server block',
  },
};
module.exports.handler = (args) => {
  create(args).catch((err) => {
    console.log(chalk.red(err));
  });
};
