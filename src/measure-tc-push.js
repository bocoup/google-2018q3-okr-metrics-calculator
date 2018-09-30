'use strict';

const moment = require('moment');

const fetchCommitsBetween = require('./util/fetch-commits-between');

module.exports = async (startDate, endDate) => {
  const owner = 'web-platform-tests';
  const repo = 'wpt';
  const ref = 'master';
  const start = moment(startDate);
  const end = moment(endDate);

  const commits = await fetchCommitsBetween(startDate, endDate, {owner, repo, ref});
  const knownCommits = [];
  const lines = ['SHA | date | TravisCI state | TaskCluster state'];
  let total = 0;

  for (const commit of commits) {
    const travisState = commit.travisStatus ?
      commit.travisStatus.state : 'unknown';
    const taskClusterState = commit.taskClusterStatus ?
      commit.taskClusterStatus.state : 'unknown';

    // Filter out commits that didn't run in either CI system (due to e.g.
    // fast-forward merges)
    if (travisState === 'unknown' && taskClusterState === 'unknown') {
      continue;
    }

    const score = taskClusterState === 'success' ? 1 : 0;

    knownCommits.push(commit);

    lines.push([
      commit.sha, commit.commit.committer.date, travisState, taskClusterState,
      score
    ].join(' | '));

    total += score;
  }

  const score = (100 * total / knownCommits.length).toFixed(2);
  //console.log(lines.join('\n'));
  console.log('Total commits:         ' + commits.length);
  console.log('Total "known" commits: ' + knownCommits.length);
  console.log('Number in agreement:   ' + total);
  console.log('Overall score:         ' + score + '%');
};
