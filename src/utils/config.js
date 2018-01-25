const path = require('path');
const fs = require('fs');

const dirs = require('./dirs');

module.exports = {
  async getMetadata(name) {
    const metadataPath = path.join(dirs.kolony, 'metadata.json');
    const json = await new Promise((resolve, reject) => {
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
    if (name) {
      const metadata = json[name];
      if (metadata) {
        return metadata;
      }
      throw new Error('cannot find application');
    } else {
      return json;
    }
  },

  async setMetadata(data, name) {
    if (name) {
      const json = await this.getMetadata();
      json[name] = data;
      const metadataPath = path.join(dirs.kolony, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(json, null, 2));
    } else {
      const metadataPath = path.join(dirs.kolony, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
    }
  },
};
