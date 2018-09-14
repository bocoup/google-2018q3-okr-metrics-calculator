'use strict';

const moment = require('moment');
const octokit = require('@octokit/rest')()

const get = require('./http-get');

module.exports = async function pullRequestsBetween(startDate, endDate, options) {
  options = Object.assign({}, options, {
    sort: 'created',
    direction: 'desc',
    per_page: 100,
    page: 1
  });
  const start = moment(startDate);
  const end = moment(endDate);
  const prs = [];

  let response = await octokit.pullRequests.getAll(options);

  while (true) {
    for (const pr of response.data) {
      const created = moment(pr.created_at);

      if (created.isAfter(end)) {
        continue;
      }
      if (created.isBefore(start)) {
        return prs;
      }

      prs.push(pr);
    }

    if (!octokit.hasNextPage(response)) {
      return prs;
    }

    response = await octokit.getNextPage(response);
  }
};
