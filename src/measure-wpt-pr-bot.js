'use strict';

const fetchPrsBetween = require('./util/fetch-prs-between');
const get = require('./util/http-get');
const scrapeLabels = require('./util/scrape-labels-from-pr-markup');
const segment = require('./util/segment');

module.exports = async (startDate, endDate) => {
  const owner = 'web-platform-tests';
  const repo = 'wpt';
  const state = 'all';
  const prs = await fetchPrsBetween(
    startDate, endDate, { owner, repo, state }
  );

  for (const subset of segment(prs, 5)) {
    (await Promise.all(subset.map((pr) => get(pr.html_url))))
      .forEach((prMarkup, index) =>  {
        const pr = subset[index];
        console.log([
          pr.created_at,
          pr.html_url, 
          scrapeLabels('wpt-pr-bot', prMarkup).length
        ].join(','));
      });
  }
};
