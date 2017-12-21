const os = require('os');
const path = require('path');

const home = os.homedir();
const kolony = path.join(home, './.kolony');

module.exports = {
  home,
  kolony,
};
