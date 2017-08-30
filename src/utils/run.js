const { execSync } = require('child_process');

module.exports = (command, inputOptions) => {
  const options = inputOptions || {};
  let builder = '';
  if (command.split(' ')[0] === 'nvm' || options.nvm) {
    builder += '. "$NVM_DIR/nvm.sh" && ';
  }
  builder += command;
  const execOptions = {
    stdio: (options.show) ? 'inherit' : 'ignore',
  };
  execSync(builder, execOptions);
};
