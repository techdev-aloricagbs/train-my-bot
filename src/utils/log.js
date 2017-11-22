// Code ported from: https://github.com/xxhomey19/nba-go/blob/master/src/utils/log.js

const chalk = require('chalk');

const error = msg => {
  console.log(chalk`{red.bold ${msg}}`);
};

const bold = msg => chalk`{white.bold ${msg}}`;

module.exports.error = error;
module.exports.bold = bold;