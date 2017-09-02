const fs = require('fs');
const path = require('path');
require('console.table');

const dirs = require('../utils/dirs');

const list = async () => {
  const ecosystems = fs.readdirSync(dirs.ecosystems).filter(file => path.extname(file) === '.json');
  const table = [];
  for (let i = 0; i < ecosystems.length; i += 1) {
    const ecosystem = ecosystems[i];
    try {
      const app = require(path.join(dirs.ecosystems, ecosystem)).apps[0];
      const nameSplit = app.name.split('-');
      let id;
      if (app.cwd) {
        id = nameSplit.pop();
      }
      const name = nameSplit.join('-');
      const port = app.port;
      const env = app.env || {};
      const environment = env.NODE_ENV;

      const domains = [];
      app.domains = app.domains || [];
      app.domains.forEach((domain) => {
        domains.push(domain.domain);
      });

      if (domains.length === 0) {
        domains.push('none');
      }

      table.push({
        id,
        name,
        port,
        environment,
        domains: domains[0],
      });
      domains.shift();
      domains.forEach((domain) => {
        table.push({
          domains: domain,
        });
      });
    } catch (err) {
      console.log(`error getting application ${ecosystem}`);
    }
  }
  console.log();
  console.table(table);
};

module.exports.command = 'apps:list';
module.exports.desc = 'list all applications';

module.exports.handler = () => {
  list().catch((err) => {
    console.log(`${err}`);
    process.exit(1);
  });
};
