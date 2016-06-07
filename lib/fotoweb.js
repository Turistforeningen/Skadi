'use strict';

const PHOTO_METADATA_KEYS = new Map([
  ['5', 'title'],
  ['20', 'albums'],
  ['25', 'tags'],
  ['40', 'copyright'],
  ['80', 'photographers'],
  ['120', 'description'],
  ['220', 'persons'],
  ['221', 'place'],
  ['222', 'area'],
]);

const BASE_URL = process.env.FOTOWEB_BASE_URL;
const API_PATH = process.env.FOTOWEB_API_PATH;
const API_URL = [BASE_URL, API_PATH].join('');
const API_TOKEN = process.env.FOTOWEB_API_TOKEN;

module.exports = {
  PHOTO_METADATA_KEYS,
  BASE_URL,
  API_PATH,
  API_URL,
  API_TOKEN,
};
