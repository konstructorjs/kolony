const os = require('os');
const fs = require('fs');
const path = require('path');

const home = os.homedir();
const kolony = path.join(home, './.kolony');
const git = path.join(kolony, './git');
const ecosystems = path.join(kolony, './ecosystems');
const builds = path.join(kolony, './builds');
const sources = path.join(kolony, './sources');
const sitesEnabled = path.join(kolony, './sites-enabled');

module.exports = {
  home,
  kolony,
  git,
  ecosystems,
  builds,
  sources,
  sitesEnabled,
  gitExists(name) {
    return fs.existsSync(path.join(git, name));
  },
};
