const fs = require('fs');
const path = require('path');
const kopy = require('kopy');
const { execSync } = require('child_process');

const check = require('../utils/check');
const dirs = require('../utils/dirs');
const { logBase, logChild } = require('../utils/logger');
const config = require('../utils/config');

const create = async (args) => {
  check.setup();

  const name = args.name;
  if (/[^a-z-]/gi.test(name)) {
    throw new Error('name must only contain lowercase letters and dashes');
  }

  const projectDir = path.join(dirs.git, name);
  const blueprintsDir = path.join(__dirname, '../../blueprints');
  const homeLink = path.join(dirs.home, name);

  const ecosystem = await config.getEcosystem(name);
  if (ecosystem) {
    throw new Error('project ecosystem already exists');
  }

  if (fs.existsSync(homeLink)) {
    throw new Error(`${homeLink} exists. please remove it and try again`);
  }

  logBase('creating git repository');
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir);
  } else {
    throw new Error('project directory already exists');
  }
  logChild('created project directory');

  process.chdir(projectDir);
  execSync('git init --bare', {
    cwd: projectDir,
  });
  logChild('initialized git repository');

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

  logBase('setting up pm2');
  await kopy(path.join(blueprintsDir, './ecosystem'), dirs.ecosystems, {
    data: {
      name,
    },
  });

  fs.renameSync(path.join(dirs.ecosystems, './ecosystem.json'), path.join(dirs.ecosystems, `${name}.json`));
  logChild('created ecosystem config');
  console.log();
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
