'use strict';

const assert = require('assert');
const request = require('supertest');
const app = request(require('../../'));
const Joi = require('joi');

const albumId = process.env.FOTOWEB_TEST_ALBUM_ID;

describe('server', () => {
  it('index', done => {
    app.get('/latest/')
      .set('Origin', 'https://example1.com')
      .expect(200)
      .expect((res) => {
        assert(/latest\/albums$/.test(res.body.albums_url));
        assert(/latest\/albums\/{album}\/photos$/.test(res.body.photos_url));
      })
      .end(done);
  });

  it('tags', function it(done) {
    this.timeout(10000);

    const url = '/latest/tags';

    app.get(url)
      .set('Origin', 'https://example1.com')
      .expect(200)
      .end((err, res) => {
        assert.ifError(err);

        assert.deepEqual(res.body, [
          { key: 'aktivitet', val: 'Aktivitet' },
          { key: 'arrangementer', val: 'Arrangementer' },
          { key: 'blinkskudd', val: 'Blinkskudd' },
          { key: 'dyr', val: 'Dyr' },
          { key: 'flora', val: 'Flora' },
          { key: 'haukeliseter', val: 'Haukeliseter' },
          { key: 'hytter', val: 'Hytter' },
          { key: 'kurs', val: 'Kurs' },
          { key: 'medlemsforening', val: 'Medlemsforening' },
          { key: 'menneske', val: 'Menneske' },
          { key: 'menneskeskapt%20objekt', val: 'Menneskeskapt objekt' },
          { key: 'mittlekeland', val: 'Mittlekeland' },
          { key: 'organisasjon', val: 'Organisasjon' },
          { key: 'preikestolen', val: 'Preikestolen' },
          { key: 'sted', val: 'Sted' },
          { key: 'utstyr', val: 'Utstyr' },
          { key: 'v%C3%A6r', val: 'Vær' },
          { key: '%C3%A5rstid', val: 'Årstid' },
        ]);

        done();
      });
  });

  it('albums', function it(done) {
    this.timeout(10000);

    const url = '/latest/albums';

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
            photosUrl: Joi.string().regex(/\/latest\/albums\/[^\/]+\/photos$/),
            posterImages: Joi.array().items(Joi.object().keys({
              size: Joi.number().integer(),
              width: Joi.number().integer(),
              height: Joi.number().integer(),
              href: Joi.string().uri({ scheme: ['http'] }),
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

    const url = `/latest/albums/${albumId}/photos`;

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
            previews: Joi.array().items(Joi.object().keys({
              size: Joi.number().integer(),
              width: Joi.number().integer(),
              height: Joi.number().integer(),
              href: Joi.string().uri({ scheme: ['http'] }),
              square: Joi.boolean(),
            })),
            attributes: Joi.object().keys({
              imageattributes: Joi.object().keys({
                pixelwidth: Joi.number().integer(),
                pixelheight: Joi.number().integer(),
                resolution: Joi.number(),
                flipmirror: Joi.number().integer(),
                rotation: Joi.number().integer().valid([-180, -90, 0, 90, 180, 270]),
                softcrop: Joi.object(),
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

  it('paging', function it(done) {
    this.timeout(10000);

    const url = `/latest/albums/${albumId}/photos`;

    app.get(`${url}?page=3`)
      .set('Origin', 'https://example1.com')
      .expect(200)
      .end((err1, res1) => {
        assert.ifError(err1);
        const arr1 = res1.body.data.map(d => d.id);

        app.get(`${url}?page=2`)
          .set('Origin', 'https://example1.com')
          .expect(200)
          .end((err2, res2) => {
            assert.ifError(err2);
            const arr2 = res2.body.data.map(d => d.id);

            assert.notDeepEqual(arr1, arr2);

            done();
          });
      });
  });

  it('tags', function it(done) {
    this.timeout(10000);

    const url = `/latest/albums/${albumId}/photos?tags=Troll`;

    app.get(url)
      .set('Origin', 'https://example1.com')
      .expect(200)
      .expect(res => res.body.data.forEach(data => {
        const tags = new Set(data.metadata.tags);
        assert(tags.has('troll') || tags.has('Troll'));
      }))
      .end(done);
  });

  it('?query', function it(done) {
    this.timeout(10000);

    const url = `/latest/albums/${albumId}/photos?query=Flaatten`;

    app.get(url)
      .set('Origin', 'https://example1.com')
      .expect(200)
      .expect(res => res.body.data.forEach(data => {
        assert(
          /flaatten/i.test((data.metadata.photographers || []).join(' ')) ||
          /flaatten/i.test((data.metadata.persons || ''))
        );
      }))
      .end(done);
  });
});
