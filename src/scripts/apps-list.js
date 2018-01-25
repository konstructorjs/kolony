require('console.table');

const { logError } = require('../utils/logger');
const config = require('../utils/config');

const list = async () => {
  const metadata = await config.getMetadata();
  const table = [];
  Object.keys(metadata).forEach((key) => {
    const app = metadata[key];
    const id = app.id || 'n/a';
    const name = app.name || 'n/a';
    const port = app.port || 'n/a';
    const env = app.env || {};
    const environment = env.NODE_ENV || 'n/a';

    const domains = [];
    app.domains = app.domains || [];
    app.domains.forEach((domain) => {
      domains.push(domain.domain);
    });

    if (domains.length === 0) {
      domains.push('n/a');
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
  });

  if (table.length === 0) {
    table.push({
      id: 'none',
      name: 'none',
      port: 'none',
      environment: 'none',
      domains: 'none',
    });
  }

  console.log();
  console.table(table);
};

module.exports.command = 'apps:list';
module.exports.desc = 'list all applications';

module.exports.handler = () => {
  list().catch((err) => {
    logError(`${err}`);
    process.exit(1);
  });
};
