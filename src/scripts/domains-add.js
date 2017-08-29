const kopy = require('kopy');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { logBase, logChild } = require('../utils/logger.js');
const fs = require('fs');
const config = require('../utils/config');

const nginxPaths = [
  '/etc/nginx/sites-enabled',
  '/usr/local/etc/nginx/sites-enabled',
];

const homeDir = os.homedir();
const kolonyDir = path.join(homeDir, './.kolony');
const blueprintsDir = path.join(__dirname, '../../blueprints');
const sitesEnabledDir = path.join(kolonyDir, './sites-enabled');

const add = async (args) => {
  const name = args.name;
  const domain = args.domain;

  logBase('looking for application information');
  const kolonyData = await config.getConfig();
  const port = (kolonyData[name]) ? kolonyData[name].port : undefined;
  if (port) {
    logChild(`found ${name} running on ${port}`);
  } else {
    throw new Error('could not find application. please push before you add a domain');
  }

  logBase('checking to see if domain is already in use');
  const duplicates = Object.keys(kolonyData).filter((key) => {
    const obj = kolonyData[key];
    return (obj.domains && obj.domains.includes(domain));
  });

  if (duplicates.length > 0) {
    throw new Error('domain is already being used');
  } else {
    logChild('domain is not already in use');
  }

  logBase(`adding ${domain} to nginx`);
  await kopy(path.join(blueprintsDir, './sites-enabled'), sitesEnabledDir, {
    data: {
      domain,
      port,
    },
  });

  fs.renameSync(path.join(sitesEnabledDir, './sites-enabled'), path.join(sitesEnabledDir, domain));

  logChild('generated nginx config file');

  let nginxPath;
  nginxPaths.some((location) => {
    if (fs.existsSync(location)) {
      nginxPath = location;
      return true;
    }
    return false;
  });

  fs.symlinkSync(path.join(sitesEnabledDir, domain), path.join(nginxPath, domain));

  logChild('copied to nginx');

  logBase('reloading nginx');
  execSync('nginx -s reload');
  logChild('nginx reloaded');

  logBase('updating application information');
  const domains = kolonyData[name].domains || [];
  domains.push(domain);
  kolonyData[name].domains = domains;

  await config.setConfig(kolonyData);
  logChild('updated application information');
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
