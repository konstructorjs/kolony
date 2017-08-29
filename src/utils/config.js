const path = require('path');
const fs = require('fs');
const os = require('os');

const homeDir = os.homedir();
const kolonyDir = path.join(homeDir, './.kolony');
const kolonyFile = path.join(kolonyDir, './kolony.json');

module.exports = {
  async getConfig() {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(kolonyFile)) {
          resolve({});
        } else {
          resolve(require(kolonyFile));
        }
      } catch (err) {
        reject('unable to load kolony data file.');
      }
    });
  },

  async setConfig(data) {
    fs.writeFileSync(kolonyFile, JSON.stringify(data, null, 2));
  },
};
