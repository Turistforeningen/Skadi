'use strict';

const PHOTO_MEDADATA = [
  ['5', 'title'],
  ['20', 'albums'],
  ['25', 'tags'],
  ['40', 'copyright'],
  ['80', 'photographers'],
  ['120', 'description'],
  ['220', 'persons'],
  ['221', 'place'],
  ['222', 'area'],
];

const PHOTO_METADATA_KEYS = new Map(PHOTO_MEDADATA);
const PHOTO_METADATA_IDS = new Map(PHOTO_MEDADATA.map(key => key.reverse()));

const BASE_URL = process.env.FOTOWEB_BASE_URL;
const API_PATH = process.env.FOTOWEB_API_PATH;
const API_URL = [BASE_URL, API_PATH].join('');
const API_TOKEN = process.env.FOTOWEB_API_TOKEN;

const PAGING_REGEX = /p=([0-9]+)/;

const parsePagingLinks = (endpoint, pages) => {
  for (const key in pages) { // eslint-disable-line no-restricted-syntax
    if (pages[key]) {
      if (PAGING_REGEX.test(pages[key])) {
        pages[key] = `${endpoint}?page=${pages[key].match(PAGING_REGEX)[1]}`;
      } else {
        pages[key] = endpoint;
      }
    } else {
      delete pages[key];
    }
  }

  return pages;
};

module.exports = {
  PHOTO_METADATA_KEYS,
  PHOTO_METADATA_IDS,
  BASE_URL,
  API_PATH,
  API_URL,
  API_TOKEN,
  parser: {
    paging: parsePagingLinks,
  },
};
