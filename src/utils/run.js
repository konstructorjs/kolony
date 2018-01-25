const shell = require('shelljs');

module.exports = (command, inputOptions) => new Promise((resolve, reject) => {
  const options = inputOptions || {};
  let builder = '';
  if (command.split(' ')[0] === 'nvm' || options.nvm) {
    builder += '. "$NVM_DIR/nvm.sh" && ';
  }
  builder += command;
  const execOptions = {
    silent: (!options.show),
  };
  const run = shell.exec(builder, execOptions);
  if (run.code !== 0) {
    reject(`${command} exited with non zero code`);
  } else {
    resolve();
  }
});
