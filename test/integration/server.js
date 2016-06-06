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

  it('albums', done => {
    const url = '/v1/albums/';

    app.get(url)
      .set('Origin', 'https://foo.com')
      .expect(200)
      .end((err, res) => {
        assert.ifError(err);

        const schema = {
          data: Joi.array().items(Joi.object().keys({
            id: Joi.string().regex(/^[\d]+\.[\w-]+$/),
            name: Joi.string(),
            description: Joi.string().allow(''),
            photosUrl: Joi.string().regex(/\/v1\/albums\/[^\/]+\/photos$/),
            href: Joi.string(),
            data: Joi.string(),
            type: Joi.string().valid('archive'),
            created: Joi.date().iso(),
            modified: Joi.date().iso(),
            deleted: Joi.date().iso().allow(null),
            archived: Joi.date().iso().allow(null),
            metadataEditor: Joi.object().keys({
              name: Joi.string(),
              href: Joi.string(),
            }),
            searchURL: Joi.string(),
            originalURL: Joi.string().allow(''),
            searchString: Joi.string().allow(''),
            taxonomies: Joi.array().items(Joi.object().keys({
              field: Joi.number().integer(),
              value: Joi.string(),
              label: Joi.string(),
              description: Joi.string().allow(''),
              href: Joi.string(),
              langAlts: Joi.array(),
              hasChildren: Joi.boolean(),
              acl: Joi.string().allow(null),
              detailsHref: Joi.string(),
              taxonomyHref: Joi.string(),
              taxonomyTitle: Joi.string(),
              synonyms: Joi.array(),
              sameAs: Joi.array(),
              linkedFields: Joi.array(),
              items: Joi.array(),
              broaderTerms: Joi.array(),
            })),
            canHaveChildren: Joi.boolean(),
            isSearchable: Joi.boolean(),
            isSelectable: Joi.boolean(),
            isLinkCollection: Joi.boolean(),
            hasChildren: Joi.boolean(),
            canCopyTo: Joi.boolean(),
            canMoveTo: Joi.boolean(),
            canUploadTo: Joi.boolean(),
            canCreateFolders: Joi.boolean(),
            canIngestToChildren: Joi.boolean(),
            canBeDeleted: Joi.boolean(),
            canBeArchived: Joi.boolean(),
            canCreateAlerts: Joi.boolean(),
            isFolderNavigationEnabled: Joi.boolean(),
            canSelect: Joi.boolean(),
            permissions: Joi.array().items(Joi.string()),
            posterImages: Joi.array().items(Joi.object().keys({
              size: Joi.number().integer(),
              width: Joi.number().integer(),
              height: Joi.number().integer(),
              href: Joi.string(),
              square: Joi.boolean(),
            })),
            posterAsset: Joi.string().allow(null),
            props: Joi.object().keys({
              owner: Joi.string().allow(null),
              shares: Joi.object(),
              comments: Joi.object(),
              facebookComments: Joi.boolean(),
              annotations: Joi.object(),
              tags: Joi.array(),
            }),
            iconCharacter: Joi.string(),
            color: Joi.string(),
          })),
          paging: Joi.object().allow(null),
        };

        const { error } = Joi.validate(res.body, schema);
        assert.ifError(error);

        done();
      });
  });
});
