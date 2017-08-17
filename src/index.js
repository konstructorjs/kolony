#!/usr/bin/env node

const yargs = require('yargs');

yargs.usage('$0 <cmd> [args]');

yargs.commandDir('scripts');
yargs.demandCommand();

yargs.help();
yargs.argv; // eslint-disable-line
