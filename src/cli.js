const program = require("commander");
const pkg = require('../package.json');
const didYouMean = require('didyoumean');
const log = require('./utils/log');
const train = require('./commands/train');

program
  .command('train')
  .alias('t')
  .option('-b --bot <bot name>', 'What specific bot to train?')
  .option('-p --profile <AWS Shared Credentials Profile>', 'What AWS profile to be used')
  .option('-r --region <The region where the bot is hosted. Defaults to us-east-1>')
  .on('--help', () => {
    console.log('');
    console.log('Train a specific AWS Lex bot by processing missed utterances');
  })
  .action(option => {
    if (!option.bot) {
      console.log('Please input the specific bot name');
      process.exit(1);
    }

    if (!option.profile) {
      console.log('Please input the specific AWS Credentials Profile.');
      process.exit(1);
    }

    if (!option.region) {
      option.region = 'us-east-1'
    }

    train(option.bot, option.profile, option.region);
  });

program.option('-v --version', pkg.version);

program.command('*').action(command => {
  error(`Unknown command: ${log.bold(command)}`);
  const commandNames = program.commands
    .map(c => c._name)
    .filter(name => name !== '*');

  const closeMatch = didYouMean(command, commandNames);
  if (closeMatch) {
    log.error(`Did you mean ${log.bold(closeMatch)} ?`);
  }
  process.exit(1);
});

if (process.argv.length === 2) program.help();

program.parse(process.argv);