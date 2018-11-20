'use strict';

const moment = require('moment');
const { format: formatUrl } = require('url');

const get = require('./util/http-get');

const fetchRevisions = async (start, end) => {
  const url = formatUrl({
    protocol: 'https',
    hostname: 'wpt.fyi',
    pathname: '/api/revisions/list',
    query: {
      epochs: 'daily',
      num_revisions: end.diff(start, 'days')
    }
  });

  return JSON.parse(await get(url)).revisions.daily;
};

const countResults = async (revision) => {
  const browsers = await Promise.all(['stable', 'experimental']
    .map((release) => {
      return formatUrl({
        protocol: 'https',
        hostname: 'wpt.fyi',
        pathname: '/api/runs',
        query: {
          sha: revision,
          labels: release
        }
      });
    })
    .map(async (url) => {
      const browsers = JSON.parse(await(get(url)))
        .map((run) => run.browser_name)
        .filter((browser_name) =>
          ['firefox', 'chrome', 'edge', 'safari'].includes(browser_name)
        );

      return new Set(browsers).size;
    }));

  return browsers.reduce((all, next) => all + next, 0);
};

/**
 * The wpt.fyi revision announcer designates one revision of the
 * web-platform-tests project for results collection. Measure overall results
 * availability by counting the number of browsers that have results on wpt.fyi
 * for each of those revisions. Consider results for the "stable" and
 * "experimental" releases of each browser to be distinct, but ignore multiple
 * results that have been uploaded for the same browser release (which
 * currently indicates some duplicated work by the Buildbot and Taskcluster
 * systems).
 */
module.exports = async (startDate, endDate) => {
  const start = moment(startDate);
  const end = moment(endDate);
  const revisions = [];

  if (start.isAfter(end)) {
    throw new Error('Invalid date range');
  }

  for (const revision of await fetchRevisions(start, end)) {
    revision.count = await countResults(revision.hash);
    revisions.push(revision);
  }

  console.log(['Date', 'ref', 'Stable', 'Experimental', 'Count'].join(' | '));
  console.log(['---', '---', '---', '---', '---'].join(' | '));
  for (const revision of revisions) {
    console.log([
      moment(revision.commit_time).format('YYYY-MM-DD'),
      revision.hash.slice(0, 10),
      `[stable](https://wpt.fyi/?sha=${revision.hash}&labels=stable)`,
      `[experimental](https://wpt.fyi/?sha=${revision.hash}&labels=experimental)`,
      revision.count
    ].join(' | '));
  }

  const actual = revisions.reduce(
    (total, revision) => total + revision.count, 0
  );

  console.log('');
  console.log('Expected (7 browsers/day): ' + end.diff(start, 'days') * 7);
  console.log('Actual: ' + actual);
};
