const chalk = require('chalk');
const os = require('os');
const fs = require('fs');
const path = require('path');
const kopy = require('kopy');
const { execSync } = require('child_process');

const create = async (args) => {
  const homeDir = os.homedir();
  const kolonyDir = path.join(homeDir, './.kolony');
  const name = args.name;
  const projectDir = path.join(kolonyDir, name);
  const blueprintsDir = path.join(__dirname, '../../blueprints');

  if (!fs.existsSync(kolonyDir)) {
    fs.mkdirSync(kolonyDir);
  }


  if (/[^a-z]/gi.test(name)) {
    throw new Error('name must only contain lowercase letters.');
  }

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir);
  } else {
    throw new Error('project directory already exists.');
  }

  process.chdir(projectDir);
  execSync('git init --bare', {
    cwd: projectDir,
  });

  fs.linkSync(projectDir, path.join(homeDir, name));

  await kopy(path.join(blueprintsDir, './post-receive'), path.join(projectDir, './hooks'), {
    data: {
      name,
    },
  });

  execSync('chmod +x ./hooks/post-receive', {
    cwd: projectDir,
  });
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
