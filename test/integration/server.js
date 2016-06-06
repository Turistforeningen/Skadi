'use strict';

const assert = require('assert');
const request = require('supertest');
const app = request(require('../../'));
const Joi = require('joi');

const albumId = process.env.FOTOWEB_ALBUM_ID;

describe('server', () => {
  it('index', done => {
    app.get('/')
      .set('Origin', 'https://foo.com')
      .expect(200)
      .expect((res) => {
        assert(/v1\/albums$/.test(res.body.v1.albums_url));
        assert(/v1\/albums\/{album}\/photos$/.test(res.body.v1.photos_url));
      })
      .end(done);
  });
});
