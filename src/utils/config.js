const path = require('path');
const fs = require('fs');

const dirs = require('./dirs');

module.exports = {
  async getEcosystem(name) {
    const ecosystemPath = path.join(dirs.ecosystems, `${name}.json`);
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(ecosystemPath)) {
          resolve(null);
        } else {
          resolve(require(ecosystemPath));
        }
      } catch (err) {
        reject('unable to load ecosystem');
      }
    });
  },

  async setEcosystem(name, data) {
    const ecosystemPath = path.join(dirs.ecosystems, `${name}.json`);
    fs.writeFileSync(ecosystemPath, JSON.stringify(data, null, 2));
  },
};
