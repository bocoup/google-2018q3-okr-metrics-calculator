'use strict';

const fetchTicketsBetween = require('./util/fetch-tickets-between');
const get = require('./util/http-get');
const scrapeLabels = require('./util/scrape-labels-from-pr-markup');
const segment = require('./util/segment');

module.exports = async (startDate, endDate) => {
  const repo = 'web-platform-tests/wpt';
  const type = 'pr';
  const prs = await fetchTicketsBetween(startDate, endDate, { repo, type });

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
