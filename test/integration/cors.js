'use strict';

const request = require('supertest');
const app = request(require('../../'));

describe('cors', () => {
  it('rejects request without origin header', done => {
    app.get('/')
      .expect(403)
      .expect({
        code: 403,
        message: 'Bad Origin "undefined"',
      }, done);
  });

  it('rejects request from uknown domain', done => {
    app.get('/')
      .set('Origin', 'https://invalid.com')
      .expect(403)
      .expect({
        code: 403,
        message: 'Bad Origin "https://invalid.com"',
      }, done);
  });

  it('accepts request from known domain', done => {
    app.get('/')
      .set('Origin', 'https://foo.com')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'https://foo.com')
      .expect('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .expect('Access-Control-Expose-Headers', 'x-response-time')
      .expect('Access-Control-Allow-Max-Age', '0')
      .expect('Access-Control-Allow-Headers', 'Content-Type')
      .end(done);
  });
});
