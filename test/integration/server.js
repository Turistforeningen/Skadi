'use strict';

const assert = require('assert');
const request = require('supertest');
const app = request(require('../../'));
const Joi = require('joi');

const albumId = process.env.FOTOWEB_TEST_ALBUM_ID;

describe('server', () => {
  it('index', done => {
    app.get('/')
      .set('Origin', 'https://example1.com')
      .expect(200)
      .expect((res) => {
        assert(/v1\/albums$/.test(res.body.v1.albums_url));
        assert(/v1\/albums\/{album}\/photos$/.test(res.body.v1.photos_url));
      })
      .end(done);
  });

  it('tags', function it(done) {
    this.timeout(10000);

    const url = '/v1/tags';

    app.get(url)
      .set('Origin', 'https://example1.com')
      .expect(200)
      .end((err, res) => {
        assert.ifError(err);

        assert.deepEqual(res.body, [
          { key: 'sted', val: 'Sted' },
          { key: 'aktivitet', val: 'Aktivitet' },
          { key: 'arrangementer', val: 'Arrangementer' },
          { key: '%C3%A5rstid', val: 'Årstid' },
          { key: 'v%C3%A6r', val: 'Vær' },
          { key: 'menneske', val: 'Menneske' },
          { key: 'organisasjon', val: 'Organisasjon' },
          { key: 'medlemsforening', val: 'Medlemsforening' },
          { key: 'utstyr', val: 'Utstyr' },
          { key: 'menneskeskapt%20objekt', val: 'Menneskeskapt objekt' },
          { key: 'flora', val: 'Flora' },
          { key: 'dyr', val: 'Dyr' },
          { key: 'hytter', val: 'Hytter' },
          { key: 'blinkskudd', val: 'Blinkskudd' },
          { key: 'haukeliseter', val: 'Haukeliseter' },
          { key: 'preikestolen', val: 'Preikestolen' },
          { key: 'kurs', val: 'Kurs' },
        ]);

        done();
      });
  });

  it('albums', function it(done) {
    this.timeout(10000);

    const url = '/v1/albums';

    app.get(url)
      .set('Origin', 'https://example1.com')
      .expect(200)
      .end((err, res) => {
        assert.ifError(err);

        const schema = {
          data: Joi.array().items(Joi.object().keys({
            id: Joi.string().regex(/^[\d]+\.[\w-]+$/),
            name: Joi.string(),
            description: Joi.string().allow(''),
            type: Joi.string().valid('archive'),
            created: Joi.date().iso(),
            modified: Joi.date().iso(),
            deleted: Joi.date().iso().allow(null),
            archived: Joi.date().iso().allow(null),
            photosUrl: Joi.string().regex(/\/v1\/albums\/[^\/]+\/photos$/),
            posterImages: Joi.array().items(Joi.object().keys({
              size: Joi.number().integer(),
              width: Joi.number().integer(),
              height: Joi.number().integer(),
              href: Joi.string(),
              square: Joi.boolean(),
            })),
            color: Joi.string(),
          })),
          paging: Joi.object().allow(null),
        };

        const { error } = Joi.validate(res.body, schema);
        assert.ifError(error);

        done();
      });
  });

  it('photos', function it(done) {
    this.timeout(10000);

    const url = `/v1/albums/${albumId}/photos?page=5`;

    app.get(url)
      .set('Origin', 'https://example1.com')
      .expect(200)
      .end((err, res) => {
        assert.ifError(err);

        const schema = {
          data: Joi.array().items(Joi.object().keys({
            id: Joi.string(),
            albumId: Joi.string(),
            created: Joi.date().iso(),
            modified: Joi.date().iso(),
            filename: Joi.string(),
            filesize: Joi.number().integer(),
            doctype: Joi.string().valid('image'),
            previews: Joi.array(),
            attributes: Joi.object().keys({
              imageattributes: Joi.object().keys({
                pixelwidth: Joi.number().integer(),
                pixelheight: Joi.number().integer(),
                resolution: Joi.number().integer(),
                flipmirror: Joi.number().integer(),
                rotation: Joi.number().integer().valid([-180, -90, 0, 90, 180]),
                colorspace: Joi.string(),
              }),
              photoAttributes: Joi.object().keys({
                cameraModel: Joi.string(),
                exposure: Joi.object(),
                fNumber: Joi.number(),
                focalLength: Joi.number(),
                isoSpeed: Joi.number().integer(),
                flash: Joi.object(),
              }),
            }),
            metadata: Joi.object().keys({
              title: Joi.string(),
              albums: Joi.array().items(Joi.string()),
              tags: Joi.array().items(Joi.string()),
              copyright: Joi.string(),
              photographers: Joi.array().items(Joi.string()),
              description: Joi.string(),
              persons: Joi.string(),
              place: Joi.string(),
              area: Joi.string(),
            }),
          })),
          paging: Joi.object().keys({
            prev: Joi.string(),
            next: Joi.string(),
            first: Joi.string(),
            last: Joi.string(),
          }).allow(null),
        };

        const { error } = Joi.validate(res.body, schema);
        assert.ifError(error);

        done();
      });
  });
});
