const path = require('path');
const bs58 = require('bs58');
const crypto = require('crypto');
const rimraf = require('rimraf');
const fs = require('fs');

const check = require('../utils/check');
const dirs = require('../utils/dirs');
const { logBase, logChild, logError } = require('../utils/logger.js');
const config = require('../utils/config');
const ports = require('../utils/ports');
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

const build = async (args) => {
  check.setup();

  const name = args.name;
  const appDir = path.join(dirs.kolony, name);
  const app = await config.getMetadata(name);
  if (!app) {
    throw new Error('cannot find application');
  } else {
    logChild('found application');
  }
  const oldID = app.id || '';
  const newID = bs58.encode(crypto.randomBytes(4));
  app.id = newID;

  const buildsDir = path.join(appDir, './builds');
  const gitDir = path.join(appDir, './git');

  process.chdir(buildsDir);

  logBase(`building application ${newID}`);
  process.env.GIT_DIR = '.git';
  logBase('cloning application');
  await run(`git clone ${gitDir} ${name}-${newID}`);
  logChild('application cloned');

  const buildDir = path.join(buildsDir, `${name}-${newID}`);
  app.cwd = buildDir;
  app.name = `${name}`;
  process.chdir(buildDir);

  let port = app.port;
  if (port) {
    logChild(`found existing port ${port}`);
  } else {
    logChild('could not find existing port');
    let done = false;
    while (!done) {
      port = ports.randomPort();
      if (ports.checkPort(port)) {
        done = true;
      }
    }
    app.port = port;
    const env = app.env || {};
    env.PORT = port;
    app.env = env;
    logChild(`generated new port ${port}`);
  }

  logBase('setting up strategy');
  const metadataDir = path.join(appDir, './metadata');
  const strategyGit = app.strategy || 'https://github.com/konstructorjs/kolony-konstructor-strategy.git';
  const strategyName = path.basename(strategyGit).replace(/\.[^/.]+$/, '');
  const strategyDir = path.join(metadataDir, strategyName);
  if (fs.existsSync(strategyDir)) {
    process.chdir(strategyDir);
    await run('git pull origin master');
    logChild('updated strategy');
  } else {
    await run(`git clone ${strategyGit} ${strategyDir}`);
    process.chdir(strategyDir);
    logChild('downloaded strategy');
  }
  await run('npm install');
  await run('npm run compile');
  logChild('installed strategy dependencies');
  process.chdir(buildDir);
  let strategy;
  try {
    strategy = require(path.join(strategyDir, 'index.js'));
  } catch (err) {
    throw new Error('unable to import strategy');
  }
  const scripts = strategy.scripts;
  const start = async (input) => {
    logBase('starting server');

    const script = input.script || '';
    if (!script) {
      throw new Error('no script defined');
    }
    const pm2Args = input.args;

    const ecosystemPath = path.join(metadataDir, './ecosystem.json');
    let ecosystem;
    try {
      ecosystem = require(ecosystemPath);
    } catch (err) {
      throw new Error('unable to load ecosystem file, try recreating the application');
    }
    ecosystem = ecosystem.apps[0];
    ecosystem.interpreter = input.interpreter || '';
    ecosystem.name = `${app.name}-${newID}`;
    ecosystem.script = script;
    ecosystem.args = pm2Args;
    ecosystem.env = app.env;

    const ecosystemWrite = {
      apps: [
        ecosystem,
      ],
    };

    fs.writeFileSync(ecosystemPath, JSON.stringify(ecosystemWrite, null, 2));

    logChild('created pm2 config');

    await run(`pm2 start ${ecosystemPath}`);
    logChild(`started server on port ${app.port}`);
  };

  let ctx = {
    app,
    logBase,
    logChild,
    logError,
    dirs: {
      buildDir,
      appDir,
    },
    run,
    start,
    state: {
      oldID,
      name,
    },
  };

  for (let i = 0; i < scripts.length; i += 1) {
    console.log();
    console.log(`--- ${scripts[i].description} ---`);
    const script = require(path.join(strategyDir, './lib', scripts[i].script));
    ctx = await script(ctx); // eslint-disable-line
  }

  console.log();
  console.log('--- adding finishing touches ---');

  logBase('saving process in pm2');
  await run('pm2 save');
  logChild('process is saved');

  logBase('saving changes');
  await config.setMetadata(app, name);
  logChild('changes saved');

  if (oldID) {
    logBase('deleting old project instance');
    try {
      await run(`pm2 stop ${name}-${oldID}`);
      await run(`pm2 delete ${name}-${oldID}`);
      await rmDir(path.join(buildsDir, `./${name}-${oldID}`));
      logChild('deleted old project data');
    } catch (err) {
      logChild('there was a problem shutting down/deleting your olde application. please do it manually');
    }
  }

  console.log();
  console.log('*** application successfully deployed ***');
  console.log();
};

module.exports.command = 'build <name>';
module.exports.desc = false;
module.exports.builder = {
  name: {
    describe: 'the name of the server block',
  },
};

module.exports.handler = (args) => {
  build(args).catch((err) => {
    logError(`${err}`);
    console.log();
    process.exit(1);
  });
};
