const fs = require('fs');
const dirs = require('../utils/dirs');

const checkExists = (dir) => {
  if (!fs.existsSync(dir)) {
    throw new Error(`unable to find directory ${dir}. please run kolony setup`);
  }
};

module.exports = {
  setup() {
    checkExists(dirs.kolony);
    checkExists(dirs.ecosystems);
    checkExists(dirs.git);
    checkExists(dirs.builds);
  },
};
