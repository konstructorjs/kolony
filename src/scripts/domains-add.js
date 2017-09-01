const kopy = require('kopy');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const dirs = require('../utils/dirs');
const { logBase, logChild } = require('../utils/logger.js');
const config = require('../utils/config');

const nginxPaths = [
  '/etc/nginx/sites-enabled',
  '/usr/local/etc/nginx/sites-enabled',
];

const blueprintsDir = path.join(__dirname, '../../blueprints');

const add = async (args) => {
  const name = args.name;
  const domain = args.domain;

  logBase('looking for application');
  const ecosystem = await config.getEcosystem(name);
  if (!ecosystem) {
    throw new Error(`couldnt find ecosystem ${name}`);
  }
  const app = ecosystem.apps[0];
  const splitName = app.name.split('-');
  splitName.pop();
  const appName = splitName.join('-');
  const port = app.port;
  logChild(`found ${appName}`);

  console.log();
  if (port) {
    logChild(`found port ${port}`);
  } else {
    throw new Error('could not find port. please push before you add a domain');
  }

  logBase('checking to see if domain is already in use');
  const existingDomains = fs.readdirSync(dirs.sitesEnabled);
  if (existingDomains.includes(domain)) {
    throw new Error('domain is already being used');
  } else {
    logChild('domain is not in use');
  }

  logBase(`adding ${domain} to nginx`);
  await kopy(path.join(blueprintsDir, './sites-enabled'), dirs.sitesEnabled, {
    data: {
      domain,
      port,
    },
  });

  fs.renameSync(path.join(dirs.sitesEnabled, './sites-enabled'), path.join(dirs.sitesEnabled, domain));

  logChild('generated nginx config file');

  let nginxPath;
  nginxPaths.some((location) => {
    if (fs.existsSync(location)) {
      nginxPath = location;
      return true;
    }
    return false;
  });

  fs.symlinkSync(path.join(dirs.sitesEnabled, domain), path.join(nginxPath, domain));

  logChild('linked to nginx');

  logBase('saving application information');
  app.domains = app.domains || [];
  app.domains.push({
    domain,
  });
  ecosystem.apps = [app];
  await config.setEcosystem(name, ecosystem);

  logBase('reloading nginx');
  execSync('nginx -s reload');
  logChild('nginx reloaded');

  console.log();
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
    console.log(`${err}`);
    process.exit(1);
  });
};
