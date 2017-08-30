const os = require('os');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const { logBase, logChild } = require('../utils/logger');
const config = require('../utils/config');
const run = require('../utils/run');

const rmDir = dirPath => new Promise((resolve, reject) => {
  rimraf(dirPath, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});

const create = async (args) => {
  const homeDir = os.homedir();
  const kolonyDir = path.join(homeDir, './.kolony');
  const name = args.name;
  const gitDir = path.join(kolonyDir, name);
  const projectDir = path.join(kolonyDir, './projects', name);
  const homeLink = path.join(homeDir, name);

  logBase('checking application information');
  const kolonyData = await config.getConfig();

  const project = kolonyData[name];
  if (!project) {
    throw new Error('cannot find application');
  } else {
    logChild('found application');
  }

  logBase('checking for domains');
  if (project.domains && project.domains.length > 0) {
    throw new Error('please remove domains before deleting an application');
  } else {
    logChild('no domains found');
  }

  logBase('removing application process');
  if (project.id) {
    run(`pm2 stop ${name}-${project.id}`);
    run(`pm2 delete ${name}-${project.id}`);
    logChild('removed application process');
  } else {
    logChild('application not running');
  }

  logBase('removing project build directory');
  if (fs.existsSync(projectDir)) {
    await rmDir(projectDir);
    logChild('removed project directory');
  } else {
    logChild('project directory does not exist');
  }

  logBase('removing links');
  if (fs.existsSync(homeLink)) {
    fs.unlinkSync(homeLink);
    logChild('unlinked files');
  }

  logBase('removing git directory');
  if (fs.existsSync(gitDir)) {
    await rmDir(gitDir);
    logChild('git directory removed');
  } else {
    logChild('git directory does not exist');
  }

  logBase('removing application information');
  delete kolonyData[name];
  await config.setConfig(kolonyData);
  logChild('removed application information');
};

module.exports.command = 'apps:destroy <name>';
module.exports.desc = 'destroy an application';
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
