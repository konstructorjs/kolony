const path = require('path');
const fs = require('fs');

const dirs = require('./dirs');

module.exports = {
  async getMetadata() {
    const metadataPath = path.join(dirs.kolony, 'metadata.json');
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(metadataPath)) {
          resolve(null);
        } else {
          resolve(require(metadataPath));
        }
      } catch (err) {
        reject('unable to load metadata');
      }
    });
  },

  async setMetadata(data) {
    const metadataPath = path.join(dirs.kolony, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
  },
};
