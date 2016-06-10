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

app.get('/v1/tags', (req, res, next) => {
  const opts = {
    url: `${fotoweb.API_URL}/taxonomies/`,
    json: true,
    headers: {
      Accept: 'application/json',
      FWAPIToken: process.env.FOTOWEB_API_TOKEN,
    },
  };

  request.get(opts, (err, resp, body) => {
    if (err) {
      return next(new HttpError('Fotoweb API Failed', 502, err));
    }

    return body.forEach(data => {
      if (data.field === parseInt(fotoweb.PHOTO_METADATA_IDS.get('tags'), 10)) {
        res.json(data.items.map(item => ({
          key: encodeURIComponent(item.value.toLowerCase()),
          val: item.value,
        })));
      }
    });
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

  if (req.query.page) {
    opts.url = `${opts.url};p=${req.query.page}`;
  }

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

    body.data = body.data.map(({
      name,
      data,
      description,
      type,
      created,
      modified,
      deleted,
      archived,
      posterImages: posterImagesOrg,
      color,
    }) => {
      const id = data.split('/')[4];
      const photosUrl = `${req.fullUrl}/v1/albums/${id}/photos`;

      const posterImages = posterImagesOrg.map(preview => {
        preview.href = [fotoweb.BASE_URL, preview.href].join('');
        return preview;
      });

      return {
        id,
        name,
        description,
        type,
        created,
        modified,
        deleted,
        archived,
        photosUrl,
        posterImages,
        color,
      };
    });

    /* Rewrite Fotoweb API paging URLs to API wrapper URLs */
    if (body.paging) {
      const url = `${req.fullUrl}/v1/albums`;
      body.paging = fotoweb.parser.paging(url, body.paging);

      res.links(body.paging);
    }

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

  if (req.query.page) {
    opts.url = `${opts.url};p=${req.query.page}`;
  }

  const qs = [];

  Object.keys(req.query).forEach(tag => {
    if (fotoweb.PHOTO_METADATA_IDS.has(tag)) {
      const key = fotoweb.PHOTO_METADATA_IDS.get(tag);
      req.query[tag].split(',').forEach(val => qs.push(`${key}=${val}`));
    }
  });

  if (qs.length) {
    opts.url = `${fotoweb.API_URL}/archives/${albumId.split('.')[0]}/`;
    opts.url = `${opts.url}?${qs.join('&')}`;
  }

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

    body.data = body.data.map(({
      created,
      modified,
      filename,
      filesize,
      doctype,
      previews: previewsOrg,
      attributes,
      metadata: metadataOrg,
    }) => {
      /* Images don't have a cononical ID; lets hope there are no duplicates */
      const id = encodeURIComponent(filename);

      /*
      // Photo metadata are returned as cryptic integers keys from the API on
      // the following format:
      //
      // "metadata": {
      //   "80": { value: [ "Marius Dalseg Sætre" ] },
      //   "120": { value: "Påsken 2016. Liomseter\nFoto Marius Dalseg Sætre" },
      //   "221": { value: "Liomseter" },
      //   "222": { value: "Langsua" },
      //   "320": { value: "5" }
      // }
      //
      // To the person who thought this was a good way to integrate with other
      // applications; what where you smoking???
      //
      // So, in order to prevent further frustration when integrating we
      // will translate the integers into properly named fields to make them
      // usable like this:
      //
      // "metadata": {
      //   "photographers": [ "Marius Dalseg Sætre" ],
      //   "description": "Påsken 2016. Liomseter\nFoto Marius Dalseg Sætre",
      //   "place": "Liomseter",
      //   "area": "Langsua" }
      // }
      */
      const metadata = {};

      for (const key in metadataOrg) { // eslint-disable-line no-restricted-syntax
        if (fotoweb.PHOTO_METADATA_KEYS.has(key)) {
          metadata[fotoweb.PHOTO_METADATA_KEYS.get(key)] = metadataOrg[key].value;
        }
      }

      /*
      // Preview urls are relative URLs to the domain of the Fotoweb
      // installation. If you intend to integrate outside of Fotoweb (why else
      // would you use the API) this does not make any sense at all!
      //
      // We make all them previews urls full URIs so we can just store them in a
      // database or display them directly to a user without having to prefix
      // the Fotoweb base url client side.
      */
      const previews = previewsOrg.map(preview => {
        preview.href = [fotoweb.BASE_URL, preview.href].join('');
        return preview;
      });

      return {
        id,
        albumId,
        created,
        modified,
        filename,
        filesize,
        doctype,
        previews,
        attributes,
        metadata,
      };
    });

    /* Rewrite Fotoweb API paging URLs to API wrapper URLs */
    if (body.paging) {
      const url = `${req.fullUrl}/v1/albums/${albumId}/photos`;
      body.paging = fotoweb.parser.paging(url, body.paging);

      res.links(body.paging);
    }

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
