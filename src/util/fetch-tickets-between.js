'use strict';

const moment = require('moment');

const get = require('./http-get');
const ghClient = require('./gh-client');

module.exports = async function fetchTicketsBetween(startDate, endDate, { repo, type }) {
  const options = {
    sort: 'created',
    order: 'desc',
    per_page: 30,
    page: 1,
    q: [
      `created:${startDate}..${endDate}`,
      'repo:' + repo
    ].join(' ')
  };
  const start = moment(startDate);
  const end = moment(endDate);
  const queryParts = [];
  const tickets = [];

  // > Note: GitHub's REST API v3 considers every pull request an issue, but
  // > not every issue is a pull request. For this reason, "Issues" endpoints
  // > may return both issues and pull requests in the response.
  //
  // This detail is why the `octokit.search.issues` method is used regardless
  // pf the type of ticket being requested.
  //
  // https://developer.github.com/v3/issues/#list-issues
  if (type) {
    if (type !== 'issue' && type !== 'pr') {
      throw new Error(`Unrecognized ticket type: "${type}"`);
    }

    options.q += ' type:' + type;
  }

  let response = await ghClient.search.issues(options);

  while (true) {
    for (const ticket of response.data.items) {
      const created = moment(ticket.created_at);

      if (created.isAfter(end)) {
        continue;
      }
      if (created.isBefore(start)) {
        return tickets;
      }

      tickets.push(ticket);
    }

    if (!ghClient.hasNextPage(response)) {
      return tickets;
    }

    response = await ghClient.getNextPage(response);
  }
};
