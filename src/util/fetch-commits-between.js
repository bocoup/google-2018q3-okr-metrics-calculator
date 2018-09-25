'use strict';

const moment = require('moment');

const ghClient = require('./gh-client');
const segment = require('./segment');

async function addStatuses(owner, repo, commit) {
  const response = await ghClient.repos.getStatuses({
    owner, repo, ref: commit.sha
  });
  const allStatuses = response.data;

  // Get the latest status from each of TravisCI and TaskCluster
  commit.travisStatus = allStatuses
    .find((status) => status.context.match(/travis/i)) || null;
  commit.taskClusterStatus = allStatuses
    .find((status) => status.context.match(/taskcluster/i)) || null;
}

module.exports = async function fetchTicketsBetween(startDate, endDate, { owner, repo, ref }) {
  const options = {
    owner,
    repo,
    sha: ref,
    since: startDate,
    until: endDate,
    per_page: 100,
    page: 1
  };
  const commits = [];

  let response = await ghClient.repos.getCommits(options);

  while (true) {
    commits.push(...response.data);

    if (!ghClient.hasNextPage(response)) {
      break;
    }

    response = await ghClient.getNextPage(response);
  }

  for (const subset of segment(commits, 5)) {
    await Promise.all(
      subset.map((commit) => addStatuses(owner, repo, commit))
    )
  }

  return commits;
};
