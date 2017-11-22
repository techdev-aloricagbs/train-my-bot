
import program from "commander";
import pkg from '../package.json';
import didYouMean from 'didyoumean';
import { error, bold } from './utils/log';

program
  .command('train')
  .alias('t')
  .option('-b --bot <bot name>', 'What specific bot to train?')
  .on('--help', () => {
    console.log('');
    console.log('Train a specific AWS Lex bot by processing missed utterances');
  })
  .action(option => {
    if (!option.bot) {
      console.log('Please input the specific bot name');
      process.exit(1);
    }

    console.log(`Training ${option.bot}..`);
  });

program.option('-v --version', pkg.version);

program.command('*').action(command => {
  error(`Unknown command: ${bold(command)}`);
  const commandNames = program.commands
    .map(c => c._name)
    .filter(name => name !== '*');

  const closeMatch = didYouMean(command, commandNames);
  if (closeMatch) {
    error(`Did you mean ${bold(closeMatch)} ?`);
  }
  process.exit(1);
});

if (process.argv.length === 2) program.help();

program.parse(process.argv);