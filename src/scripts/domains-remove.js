const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const { logBase, logChild } = require('../utils/logger');
const config = require('../utils/config');

const nginxPaths = [
  '/etc/nginx/sites-enabled',
  '/usr/local/etc/nginx/sites-enabled',
];

const homeDir = os.homedir();
const kolonyDir = path.join(homeDir, './.kolony');
const sitesEnabledDir = path.join(kolonyDir, './sites-enabled');

const remove = async (args) => {
  const name = args.name;
  const domain = args.domain;

  const kolonyData = await config.getConfig();
  const project = kolonyData[name];
  if (project) {
    logChild(`found ${name}`);
  } else {
    throw new Error('could not find application. please push before you add a domain');
  }

  logBase('looking for application information');

  logBase('verifying domain is added to this project');
  const domains = project.domains || [];
  if (!domains.includes(domain)) {
    throw new Error('domain not found');
  } else {
    logChild('found domain');
  }

  logBase('updating nginx');

  fs.unlinkSync(path.join(sitesEnabledDir, domain));
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

  logBase('reloading nginx');
  execSync('nginx -s reload');
  logChild('nginx reloaded');

  logBase('updating application information');
  const index = domains.indexOf(domain);
  domains.splice(index, 1);
  kolonyData[name].domains = domains;

  config.setConfig(kolonyData);
  logChild('application information updated');
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
