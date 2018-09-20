'use strict';

const moment = require('moment');

const fetchTicketsBetween = require('./util/fetch-tickets-between');
const segment = require('./util/segment');
const timeToTriage = require('./util/time-to-triage');
const owners = ['jugglinmike'];

module.exports = async (startDate, endDate) => {
  const repo = 'web-platform-tests/results-collection';
  const allIssues = await fetchTicketsBetween(startDate, endDate, { repo });
  const fromContributors = [];

  for (let subset of segment(allIssues, 5)) {
    await Promise.all(
      subset.map(async (issue) => {
        issue.delay = await timeToTriage(owners, issue);
      }));

    fromContributors.push(...subset.filter((issue) => issue.delay));
  }

  fromContributors.forEach((issue) => {
    console.log(
      `https://github.com/${repo}/issues/${issue.number} | ${issue.delay}`
    );
  });
  const total = fromContributors.reduce((total, issue) => total + issue.delay, 0);
  const averageHours = moment.duration(total/fromContributors.length).asHours();

  console.log(`Average time-to-response: ${averageHours.toFixed(1)} hours`);
};
