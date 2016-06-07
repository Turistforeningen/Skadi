'use strict';

/* istanbul ignore if  */
if (process.env.NODE_ENV === 'production') {
  /* eslint-disable no-console */
  console.log('Starting newrelic application monitoring');
  /* eslint-enable */
  require('newrelic'); // eslint-disable-line global-require
}

const raven = require('raven');
const sentry = require('./lib/sentry');
const fotoweb = require('./lib/fotoweb');
const request = require('request');

const express = require('express');
const compression = require('compression');
const responseTime = require('response-time');
const HttpError = require('@starefossen/http-error');

const app = module.exports = express();

app.set('json spaces', 2);
app.set('x-powered-by', false);
app.set('etag', false);

app.use(compression());
app.use(responseTime());

// Full URL
const fullUrl = require('./lib/express-full-url');
app.use(fullUrl);

// Cors Headers
const corsHeaders = require('@starefossen/express-cors');
app.use(corsHeaders.middleware);

// Health Check
const healthCheck = require('@starefossen/express-health');
app.get('/CloudHealthCheck', healthCheck({
  name: 'Fotoweb',
  check: cb => {
    const opts = {
      url: `${fotoweb.API_URL}/`,
      json: true,
      headers: {
        Accept: 'application/vnd.fotoware.api-descriptor+json',
        FWAPIToken: process.env.FOTOWEB_API_TOKEN,
      },
    };

    request.get(opts, (err, resp, body) => {
      cb(err, body);
    });
  },
}));

app.get('/', (req, res) => {
  res.json({
    v1: {
      albums_url: `${req.fullUrl}/v1/albums`,
      photos_url: `${req.fullUrl}/v1/albums/{album}/photos`,
    },
  });
});

app.get('/v1/albums', (req, res, next) => {
  const opts = {
    url: `${fotoweb.API_URL}/me/archives/`,
    json: true,
    headers: {
      Accept: 'application/vnd.fotoware.collectionlist+json',
      FWAPIToken: process.env.FOTOWEB_API_TOKEN,
    },
  };

  request.get(opts, (err, resp, body) => {
    if (err) {
      return next(new HttpError('Fotoweb API Failed', 502, err));
    } else if (body.value === 'Unauthorized') {
      return next(new HttpError('Fotoweb API Authentication Failed', 502));
    } else if (body.value === 'NotAcceptable') {
      return next(new HttpError('Fotoweb API did not accept mediatype', 502));
    } else if (res.statusCode !== 200) {
      return next(new HttpError(`Fotoweb API returned "${res.statusCode}"`, 502));
    } else if (typeof body.data === 'undefined') {
      console.log('Fotoweb API data', body); // eslint-disable-line no-console
      return next(new HttpError('Fotoweb API returned no data', 502));
    }

    body.data = body.data.map(album => {
      album.id = album.data.split('/')[4];
      album.photosUrl = `${req.fullUrl}/v1/albums/${album.id}/photos`;

      return album;
    });

    // @TODO add links header

    return res.json(body);
  });
});

app.get('/v1/albums/:album/photos', (req, res, next) => {
  const albumId = req.params.album;

  const opts = {
    url: `${fotoweb.API_URL}/data/a/${albumId}/`,
    json: true,
    headers: {
      Accept: 'application/vnd.fotoware.assetlist+json',
      FWAPIToken: process.env.FOTOWEB_API_TOKEN,
    },
  };

  request.get(opts, (err, resp, body) => {
    if (err) {
      return next(new HttpError('Fotoweb API Failed', 502, err));
    } else if (body.value === 'Unauthorized') {
      return next(new HttpError('Fotoweb API Authentication Failed', 502));
    } else if (body.value === 'NotAcceptable') {
      return next(new HttpError('Fotoweb API did not accept mediatype', 502));
    } else if (body.value === 'ArchiveNotFound') {
      return next(new HttpError('Album Not Found', 404));
    } else if (res.statusCode !== 200) {
      return next(new HttpError(`Fotoweb API returned "${res.statusCode}"`, 502));
    } else if (typeof body.data === 'undefined') {
      return next(new HttpError('Fotoweb API returned no data', 502));
    }

    body.data = body.data.map(photo => {
      const photoId = photo.filename;

      photo.id = photoId;
      photo.albumId = albumId;

      const metadata = {};

      for (const key in photo.metadata) {
        if (fotoweb.PHOTO_METADATA_KEYS.has(key)) {
          metadata[fotoweb.PHOTO_METADATA_KEYS.get(key)] = photo.metadata[key].value;
        }
      }

      photo.metadata = metadata;

      return photo;
    });

    // @TODO add full url to `previews[i].href`
    // @TODO add links header

    return res.json(body);
  });
});

// Not Found
app.use((req, res, next) => next(new HttpError('Not Found', 404)));

// Sentry Error Handling
app.use(raven.middleware.express.requestHandler(sentry));
app.use(raven.middleware.express.errorHandler(sentry));

// Final Error Handling
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Wrap non-http errors
  if (!(err instanceof HttpError)) {
    err = new HttpError(err.message, 500, err); // eslint-disable-line no-param-reassign
  }

  /* eslint-disable no-console */
  if (err.code >= 500) {
    if (err.error) {
      console.error(err.error.message);
      console.error(err.error.stack);
    } else {
      console.error(err.message);
      console.error(err.stack);
    }
  }
  /* eslint-enable */

  res.status(err.code).json(err.toJSON());
});

/* istanbul ignore if */
if (!module.parent) {
  const port = process.env.VIRTUAL_PORT || 8080;

  app.listen(port);
  console.log(`Server listening on port ${port}`); // eslint-disable-line no-console
}
