const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const dirs = require('../utils/dirs');
const { logBase, logChild } = require('../utils/logger');
const config = require('../utils/config');

const nginxPaths = [
  '/etc/nginx/sites-enabled',
  '/usr/local/etc/nginx/sites-enabled',
];

const remove = async (args) => {
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
  logChild(`found ${appName}`);

  logBase('verifying domain is added to this project');
  const domains = app.domains || [];
  const filteredDomains = domains.filter(obj => obj.domain === domain);
  if (filteredDomains.length === 0) {
    throw new Error('domain not found');
  } else {
    logChild('found domain');
  }

  logBase('updating nginx');
  fs.unlinkSync(path.join(dirs.sitesEnabled, domain));
  logChild('removed config file');

  let nginxPath;
  nginxPaths.some((location) => {
    if (fs.existsSync(location)) {
      nginxPath = location;
      return true;
    }
    return false;
  });

  fs.unlinkSync(path.join(nginxPath, domain));
  logChild('updated nginx');

  logBase('saving application information');
  app.domains = domains.filter(obj => obj.domain !== domain);
  ecosystem.apps = [app];
  await config.setEcosystem(name, ecosystem);

  logBase('reloading nginx');
  execSync('nginx -s reload');
  logChild('nginx reloaded');

  console.log();
};

module.exports.command = 'domains:remove <name> <domain>';
module.exports.desc = 'remove a domain from an application';
module.exports.builder = {
  name: {
    describe: 'project name',
  },
  domain: {
    describe: 'domain name',
  },
};

module.exports.handler = (args) => {
  remove(args).catch((err) => {
    console.log(`${err}`);
    process.exit(1);
  });
};
