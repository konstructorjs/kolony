const kopy = require('kopy');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const dirs = require('../utils/dirs');
const { logBase, logChild, logError } = require('../utils/logger.js');
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
  const app = await config.getMetadata(name);
  const json = await config.getMetadata();
  const port = app.port;
  logChild(`found ${app.name}`);

  console.log();
  if (port) {
    logChild(`found port ${port}`);
  } else {
    throw new Error('could not find port. please push before you add a domain');
  }

  logBase('checking to see if domain is already in use');
  Object.keys(json).forEach((key) => {
    const domains = json[key].domains || [];
    domains.forEach((row) => {
      if (row.domain === domain) {
        throw new Error('domain is already being used');
      }
    });
  });

  logChild('domain is not in use');

  logBase(`adding ${domain} to nginx`);
  const appDir = path.join(dirs.kolony, name);
  const metadataDir = path.join(appDir, './metadata');
  await kopy(path.join(blueprintsDir, './sites-enabled'), metadataDir, {
    data: {
      domain,
      port,
    },
  });

  fs.renameSync(path.join(metadataDir, './sites-enabled'), path.join(metadataDir, domain));

  logChild('generated nginx config file');

  let nginxPath;
  nginxPaths.some((location) => {
    if (fs.existsSync(location)) {
      nginxPath = location;
      return true;
    }
    return false;
  });

  fs.symlinkSync(path.join(metadataDir, domain), path.join(nginxPath, domain));

  logChild('linked to nginx');

  logBase('saving application information');
  app.domains = app.domains || [];
  app.domains.push({
    domain,
  });
  await config.setMetadata(app, name);

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
    logError(`${err}`);
    process.exit(1);
  });
};
