'use strict';

const cheerio = require('cheerio');

module.exports = function scrapeLabels(userName, markup) {
  const $ = cheerio.load(markup);

  const $el = $('.discussion-item-labeled')
    .toArray()
    .map((el) => $(el))
    .filter(($el) => $el.text().includes(userName))[0];

  if (!$el) {
    return [];
  }
  return $el.find('.IssueLabel')
    .toArray()
    .map((el) => $(el).text().trim());
};
