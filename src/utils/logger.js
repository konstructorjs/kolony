module.exports = {
  logBase(message) {
    console.log(`> ${message}`);
  },

  logChild(message) {
    console.log(`\t${message}`);
  },
};
