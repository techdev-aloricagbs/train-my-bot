// Code ported from: https://github.com/xxhomey19/nba-go/blob/master/src/utils/log.js

import chalk from 'chalk';

const error = msg => {
  console.log(chalk`{red.bold ${msg}}`);
};

const bold = msg => chalk`{white.bold ${msg}}`;

export { error, bold };