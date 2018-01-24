const portscanner = require('portscanner');

module.exports = {
  randomPort() {
    return Math.floor((Math.random() * ((10000 - 1024) + 1)) + 1024);
  },

  // TODO: Check the metadata file to check if the port is taken
  checkPort(port) {
    return new Promise((resolve, reject) => {
      portscanner.checkPortStatus(port, '127.0.0.1', (err, status) => {
        if (err) {
          reject(err);
        }
        resolve(status === 'closed');
      });
    });
  },
};
