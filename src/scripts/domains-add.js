const kopy = require('kopy');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const nginxPaths = [
  '/etc/nginx/sites-enabled',
  '/usr/local/etc/nginx/sites-enabled',
];

const homeDir = os.homedir();
const kolonyDir = path.join(homeDir, './.kolony');
const kolonyFile = path.join(kolonyDir, './kolony.json');
const blueprintsDir = path.join(__dirname, '../../blueprints');
const sitesEnabledDir = path.join(kolonyDir, './sites-enabled');

const add = async (args) => {
  const name = args.name;
  const domain = args.domain;
  let kolonyData;
  let port;
  try {
    kolonyData = require(kolonyFile);
    port = kolonyData[name].port;
  } catch (_) {
    throw new Error('could not find project. please push before you add a domain');
  }
  await kopy(path.join(blueprintsDir, './sites-enabled'), sitesEnabledDir, {
    data: {
      domain,
      port,
    },
  });

  fs.renameSync(path.join(sitesEnabledDir, './sites-enabled'), path.join(sitesEnabledDir, domain));

  let nginxPath;
  nginxPaths.some((location) => {
    if (fs.existsSync(location)) {
      nginxPath = location;
      return true;
    }
    return false;
  });

  fs.symlinkSync(path.join(sitesEnabledDir, domain), path.join(nginxPath, domain));

  execSync('nginx -s reload');
};

module.exports.command = 'domains:add <name> <domain>';
module.exports.desc = 'add a domain to an application';
module.exports.builder = {
  name: {
    describe: 'project name',
  },
  domain: {
    describe: 'domain name',
  },
};

module.exports.handler = (args) => {
  add(args).catch((err) => {
    console.log(` [ERR] ${err}`);
    process.exit(1);
  });
};
