'use strict';

const request = require('supertest');
const app = request(require('../../'));

describe('health', () => {
  it('checks access to API', done => {
    app.get('/CloudHealthCheck')
      .set('Origin', 'https://example1.com')
      .expect(200)
      .expect({
        code: 200,
        message: 'Ok',
        services: [{
          name: 'Fotoweb',
          status: {
            server: process.env.FOTOWEB_TEST_API_SERVER,
            version: process.env.FOTOWEB_TEST_API_VERSION,
            archives: '/fotoweb/archives/',
            albums: '/fotoweb/albums/',
            taxonomies: '/fotoweb/taxonomies/',
            screens: '/fotoweb/screens/',
            services: {
              login: '/fotoweb/login',
              search: '/fotoweb/search/',
              utc_offset: 60,
            },
          },
        }],
      }, done);
  });
});
