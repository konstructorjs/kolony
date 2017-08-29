const os = require('os');
const fs = require('fs');
const path = require('path');
const kopy = require('kopy');
const { execSync } = require('child_process');
const config = require('../utils/config');
const { logBase, logChild } = require('../utils/logger');

const create = async (args) => {
  const homeDir = os.homedir();
  const kolonyDir = path.join(homeDir, './.kolony');
  const name = args.name;
  const projectDir = path.join(kolonyDir, name);
  const blueprintsDir = path.join(__dirname, '../../blueprints');
  const homeLink = path.join(homeDir, name);

  if (!fs.existsSync(kolonyDir)) {
    throw new Error('unable to find kolony directory. please run kolony setup');
  }

  if (/[^a-z]/gi.test(name)) {
    throw new Error('name must only contain lowercase letters');
  }

  const kolonyData = await config.getConfig();
  if (kolonyData[name]) {
    throw new Error('project entry already exists in kolony data file');
  }

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir);
  } else {
    throw new Error('project directory already exists');
  }

  if (fs.existsSync(homeLink)) {
    throw new Error(`${homeLink} exists. please remove it and try again`);
  }

  logBase('creating git project');
  process.chdir(projectDir);
  execSync('git init --bare', {
    cwd: projectDir,
  });
  logChild('created git project');

  logBase('setting up repository');
  fs.symlinkSync(projectDir, homeLink);
  logChild('linked files');

  await kopy(path.join(blueprintsDir, './post-receive'), path.join(projectDir, './hooks'), {
    data: {
      name,
    },
  });

  execSync('chmod +x ./hooks/post-receive', {
    cwd: projectDir,
  });
  logChild('set up hooks');

  logBase('saving application information');
  kolonyData[name] = {};
  await config.setConfig(kolonyData);
  logChild('saved application information');
};

module.exports.command = 'apps:create <name>';
module.exports.desc = 'create a new application';
module.exports.builder = {
  name: {
    describe: 'the name of the application',
  },
};
module.exports.handler = (args) => {
  create(args).catch((err) => {
    console.log(`${err}`);
    process.exit(1);
  });
};
