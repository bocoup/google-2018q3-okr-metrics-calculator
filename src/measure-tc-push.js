'use strict';

const moment = require('moment');

const fetchCommitsBetween = require('./util/fetch-commits-between');

const problemState = /error|failure/;

function grade(travisState, taskClusterState) {
  // TravisCI is assumed to be correct in all cases.
  if (travisState === taskClusterState) {
    return 1;
  }

  if (problemState.test(travisState) && problemState.test(taskClusterState)) {
    return 1;
  }

  return 0;
}

module.exports = async (startDate, endDate) => {
  const owner = 'web-platform-tests';
  const repo = 'wpt';
  const ref = 'master';
  const start = moment(startDate);
  const end = moment(endDate);

  const commits = await fetchCommitsBetween(startDate, endDate, {owner, repo, ref});
  const lines = ['SHA | date | TravisCI state | TaskCluster state'];
  let total = 0;

  for (const commit of commits) {
    const travisState = commit.travisStatus ?
      commit.travisStatus.state : 'unknown';
    const taskClusterState = commit.taskClusterStatus ?
      commit.taskClusterStatus.state : 'unknown';
    const score = grade(travisState, taskClusterState);

    lines.push([
      commit.sha, commit.commit.committer.date, travisState, taskClusterState,
      score
    ].join(' | '));

    total += score;
  }

  const score = (100 * total / commits.length).toFixed(2);
  //console.log(lines.join('\n'));
  console.log('Total commits:       ' + commits.length);
  console.log('Number in agreement: ' + total);
  console.log('Overall score:       ' + score + '%');
};
