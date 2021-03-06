'use strict';
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

const request = require('supertest');
const app = request(require('../../'));

describe('cors', () => {
  it('rejects request without origin header', done => {
    app.get('/latest/')
      .expect(403)
      .expect({
        code: 403,
        message: 'Bad Origin "undefined"',
      }, done);
  });

  it('rejects request from uknown domain', done => {
    app.get('/latest/')
      .set('Origin', 'https://invalid.com')
      .expect(403)
      .expect({
        code: 403,
        message: 'Bad Origin "https://invalid.com"',
      }, done);
  });

  it('accepts request from known domain', done => {
    app.get('/latest/')
      .set('Origin', 'https://example1.com')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'https://example1.com')
      .expect('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .expect('Access-Control-Expose-Headers', 'x-response-time')
      .expect('Access-Control-Allow-Max-Age', '0')
      .expect('Access-Control-Allow-Headers', 'Content-Type')
      .end(done);
  });
});
