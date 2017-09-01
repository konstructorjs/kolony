module.exports = {
  logBase(message) {
    console.log();
    console.log(`--> ${message}`);
  },

  logChild(message) {
    console.log(`    ${message}`);
  },
};
