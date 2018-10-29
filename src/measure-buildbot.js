'use strict';

const moment = require('moment');
const { format: formatUrl } = require('url');

const get = require('./util/http-get');

const q2Start = moment('2018-04-01');
// Prior to this date, all results were uploaded by the same system, so the
// "buildbot" label was not available and should not be required.
const otherUploaders = moment('2018-06-22');
const milestones = {
  // https://github.com/web-platform-tests/results-collection/commit/c8952d37985b44ebba85585f5436051cec425f4a
  experimental: moment('2018-03-27'),
  // https://github.com/web-platform-tests/results-collection/commit/5bcfd4395f7079f4fe7c932521289cc7f106b47c
  dailyRemotes: moment('2018-05-11'),
  // https://github.com/web-platform-tests/results-collection/commit/b7377d4c7f85fcac8f792959fa20f362dddb060e
  safariTP: moment('2018-08-16'),
};

/**
 * The maximum number of test results to retrieve per request to the wpt.fyi
 * HTTP API.
 */
const maxCount = 300;

const overlappingDays = (rangeA, rangeB) => {
  const overlap = [
    rangeA[0].isAfter(rangeB[0]) ? rangeA[0] : rangeB[0],
    rangeA[1].isBefore(rangeB[1]) ? rangeA[1] : rangeB[1]
  ];
  const count = overlap[1].diff(overlap[0], 'days');

  return count > 0 ? count : 0;
};

const expectedCount = (start, end) => {
  const now = moment();
  const daysWithDailyRemotes = overlappingDays(
    [start, end], [milestones.dailyRemotes, now]
  );
  const daysWithSafariTP = overlappingDays(
    [start, end], [milestones.safariTP, now]
  );
  const daysWithExperimental = overlappingDays(
    [start, end], [milestones.experimental, now]
  );

  // For all supported dates, stable Firefox and stable Chrome have been
  // expected to run four times per day. In addition, stable Edge and stable
  // Safari have been expected to run once every two days.
  return end.diff(start, 'days') * 9 +
    // For dates that experimental builds were supported, Firefox Nightly and
    // Chrome Dev have been expected to run four times per day.
    daysWithExperimental * 8 +
    // For dates that remote browsers were run on a daily basis, stable Edge
    // and stable Safari each contributed an additional result set every other
    // day.
    daysWithDailyRemotes +
    // For dates that Safari Technology Preview was supported, it was expected
    // to run twice per day.
    daysWithSafariTP * 2;
};

const actualCount = async (start, end) => {
  const runs = new Set();
  const current = start.clone();

  while (current.isBefore(end)) {
    const previous = current.clone();
    current.add(7, 'days');
    const labels = previous.isAfter(otherUploaders) ? ['buildbot'] : [];

    const url = formatUrl({
      protocol: 'https',
      hostname: 'wpt.fyi',
      pathname: '/api/runs',
      query: {
        labels,
        from: previous.utc().format(),
        to: current.utc().format()
      }
    });

    JSON.parse(await get(url))
      .filter((run) => moment(run.created_at).isBetween(start, end))
      .forEach((run) => runs.add(run.id));
  }

  return runs.size;
};

/**
 * Measure the performance of the Buildbot-powered results collection system by
 * counting the number of results on wpt.fyi that are attributed to that
 * system. Calculate the expected number of results according to the dates
 * requested and the project milestones which influenced the cadence of
 * collection attempts.
 */
module.exports = async (startDate, endDate) => {
  const start = moment(startDate);
  const end = moment(endDate);

  if (start.isAfter(end)) {
    throw new Error('Invalid date range');
  }

  if (start.isBefore(q2Start)) {
    throw new Error(
      'This script may only score dates after ' + q2Start.toISOString()
    );
  }

  return {
    expected: expectedCount(start, end),
    actual: await actualCount(start, end)
  };
};
