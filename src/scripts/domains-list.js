require('console.table');

const config = require('../utils/config');

const list = async (args) => {
  const name = args.name;

  const ecosystem = await config.getEcosystem(name);
  const app = ecosystem.apps[0];
  if (!ecosystem) {
    throw new Error('couldnt find ecosystem');
  }

  const table = [];

  const domains = [];
  app.domains.forEach((domain) => {
    domains.push(domain.domain);
  });

  if (domains.length === 0) {
    table.push({
      domains: 'none',
    });
  } else {
    table.push({
      domains: domains[0],
    });
    domains.shift();
    domains.forEach((domain) => {
      table.push({
        domains: domain,
      });
    });
  }

  console.log();
  console.table(table);
};

module.exports.command = 'domains:list <name>>';
module.exports.desc = 'list domains for an application';
module.exports.builder = {
  name: {
    describe: 'project name',
  },
};

module.exports.handler = (args) => {
  list(args).catch((err) => {
    console.log(`${err}`);
    process.exit(1);
  });
};
