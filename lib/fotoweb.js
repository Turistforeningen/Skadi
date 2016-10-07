'use strict';

const PHOTO_METADATA = [
  ['q', 'query'],
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

const PHOTO_METADATA_KEYS = new Map(PHOTO_METADATA);
const PHOTO_METADATA_IDS = new Map(PHOTO_METADATA.map(key => [...key].reverse()));

const QUERY_PARAMS = [
  ['p', 'page'],
  ...PHOTO_METADATA,
];

const QUERY_PARAMS_KEYS = new Map(QUERY_PARAMS);
const QUERY_PARAMS_IDS = new Map(QUERY_PARAMS.map(key => [...key].reverse()));

const BASE_URL = process.env.FOTOWEB_BASE_URL;
const API_PATH = process.env.FOTOWEB_API_PATH;
const API_URL = [BASE_URL, API_PATH].join('');
const API_TOKEN = process.env.FOTOWEB_API_TOKEN;

const QUERY_PARAMS_REGEX = new RegExp(
  `((${QUERY_PARAMS.map(key => key[0]).join('|')})=([^&]+))`, 'gi'
);

// Rebuild paging query string to use ID's from PHOTO_METADATA map
const parsePagingLinks = (endpoint, pages) => {
  for (const key in pages) { // eslint-disable-line no-restricted-syntax
    if (pages[key]) {
      if (QUERY_PARAMS_REGEX.test(pages[key])) {
        // Find all FotoWeb query keys in paging URL
        const keyQueryParams = pages[key].match(QUERY_PARAMS_REGEX) || [];
        const idQueryParams = keyQueryParams.map(item => {
          const arr = item.split('=');
          // Replace FotoWeb key with Skadi ID
          // Example: ['25', 'Menneske'] => ['tags', 'Menneske']
          arr[0] = QUERY_PARAMS_KEYS.get(arr[0]);
          return arr.join('=');
        });

        pages[key] = `${endpoint}?${idQueryParams.join('&')}`;
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
  QUERY_PARAMS_KEYS,
  QUERY_PARAMS_IDS,
  BASE_URL,
  API_PATH,
  API_URL,
  API_TOKEN,
  parser: {
    paging: parsePagingLinks,
  },
};
