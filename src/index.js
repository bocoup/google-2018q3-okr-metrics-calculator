'use strict';

const path = require('path');

const octokit = require('@octokit/rest')()
const Replay = require('replay');

const measureWptPrBot = require('./measure-wpt-pr-bot');

const token = require('./util/load-gh-token')(
  path.join(__dirname, '..', 'github-token.txt')
);

Replay.mode = 'record';
Replay.fixtures = path.join(__dirname, '..', 'fixtures');

// Omit token value from the recorded requests which are persisted to disk
Replay.headers = Replay.headers
  .filter((pattern) => !pattern.test('authorization: token abcdef'));

octokit.authenticate({ type: 'token', token });

measureWptPrBot('2018-07-01', '2018-10-01');