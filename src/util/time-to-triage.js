'use strict';

const moment = require('moment');

const ghClient = require('./gh-client');

async function timeToFirstComment(owners, ticket) {
  const [owner, repo] = ticket.repository_url.split('/').slice(-2);
  const options = {
    repo,
    owner,
    number: ticket.number
  };
  const response = await ghClient.issues.getComments(options);

  while (true) {
    for (const comment of response.data) {
      if (owners.includes(comment.user.login)) {
        return moment(comment.created_at).diff(ticket.created_at, 'ms');
      }
    }

    if (!ghClient.hasNextPage(response)) {
      break;
    }

    response = await ghClient.getNextPage(response);
  }

  return Infinity;
}

async function timeToFirstReview(owners, ticket) {
  if (!ticket.pull_request) {
    return Infinity;
  }

  const [owner, repo] = ticket.repository_url.split('/').slice(-2);
  const options = {
    repo,
    owner,
    number: ticket.number
  };
  const response = await ghClient.pullRequests.getReviews(options);

  while (true) {
    for (const review of response.data) {
      if (owners.includes(review.user.login)) {
        return moment(review.submitted_at).diff(ticket.created_at, 'ms');
      }
    }

    if (!ghClient.hasNextPage(response)) {
      break;
    }

    response = await ghClient.getNextPage(response);
  }

  return Infinity;
}

module.exports = async (owners, ticket) => {
  if (owners.includes(ticket.user.login)) {
    return 0;
  }

  return Math.min(
    await timeToFirstComment(owners, ticket),
    await timeToFirstReview(owners, ticket)
  );
};
