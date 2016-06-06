'use strict';

if (process.env.NODE_ENV === 'production') {
  /* eslint-disable no-console */
  console.log('Starting newrelic application monitoring');
  /* eslint-enable */
  require('newrelic'); // eslint-disable-line global-require
}

const raven = require('raven');
const sentry = require('./lib/sentry');
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
    // @TODO implement proper API health check
    cb(null, 'Hello');
  },
}));

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

/* istanbul ignore next */
if (!module.parent) {
  const port = process.env.VIRTUAL_PORT || 8080;

  app.listen(port);
  console.log(`Server listening on port ${port}`); // eslint-disable-line no-console
}
