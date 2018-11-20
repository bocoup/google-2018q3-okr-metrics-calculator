'use strict';

const path = require('path');

const Replay = require('replay');
const yargs = require('yargs');

Replay.mode = 'record';
Replay.fixtures = path.join(__dirname, '..', 'fixtures');

// Omit token value from the recorded requests which are persisted to disk
Replay.headers = Replay.headers
  .filter((pattern) => !pattern.test('authorization: token abcdef'));

yargs.command(
    'wpt-pr-bot <startDate> <endDate>',
    'score the bot',
    {},
    async ({startDate, endDate}) => {
      const measureWptPrBot = require('./measure-wpt-pr-bot');
      await measureWptPrBot(startDate, endDate);
    })
  .command(
    'buildbot <startDate> <endDate>',
    'score results collection',
    {},
    async ({startDate, endDate}) => {
      const measureBuildbot = require('./measure-buildbot');
      const { actual, expected } = await measureBuildbot(startDate, endDate);
      console.log('# of results expected: ' + expected);
      console.log('# of results uploaded: ' + actual);
    })
  .command(
    'rc-triage <startDate> <endDate>',
    'score triage for results collection issues',
    {},
    async ({startDate, endDate}) => {
      const measureRcTriage = require('./measure-rc-triage');
      await measureRcTriage(startDate, endDate);
    })
  .command(
    'tc-push <startDate> <endDate>',
    'score TaskCluster performance on pushes to `master`',
    {},
    async ({startDate, endDate}) => {
      const measureTCPush = require('./measure-tc-push');
      await measureTCPush(startDate, endDate);
    })
  .command(
    'daily-results <startDate> <endDate>',
    'score results collection (uploaded agnostic)',
    {},
    async ({startDate, endDate}) => {
      const measureDaily = require('./measure-daily-results');
      await measureDaily(startDate, endDate);
    })
  .demandCommand()
  .strict()
  .argv;
