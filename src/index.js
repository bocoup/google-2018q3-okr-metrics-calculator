'use strict';

const path = require('path');

const octokit = require('@octokit/rest')()
const Replay = require('replay');
const yargs = require('yargs');

const token = require('./util/load-gh-token')(
  path.join(__dirname, '..', 'github-token.txt')
);

Replay.mode = 'record';
Replay.fixtures = path.join(__dirname, '..', 'fixtures');

// Omit token value from the recorded requests which are persisted to disk
Replay.headers = Replay.headers
  .filter((pattern) => !pattern.test('authorization: token abcdef'));

octokit.authenticate({ type: 'token', token });

yargs.command(
    'wpt-pr-bot <startDate> <endDate>',
    'score the bot',
    {},
    ({startDate, endDate}) => {
      const measureWptPrBot = require('./measure-wpt-pr-bot');
      measureWptPrBot(startDate, endDate);
    })
  .demandCommand()
  .strict()
  .argv;
