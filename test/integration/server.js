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

  it('albums', function it(done) {
    this.timeout(10000);

    const url = '/v1/albums/';

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

  it('photos', function it(done) {
    this.timeout(10000);

    const url = `/v1/albums/${albumId}/photos`;

    app.get(url)
      .set('Origin', 'https://example1.com')
      .expect(200)
      .end((err, res) => {
        assert.ifError(err);

        const schema = {
          data: Joi.array().items(Joi.object().keys({
            id: Joi.string(),
            albumId: Joi.string(),
            href: Joi.string(),
            archiveHREF: Joi.string(),
            linkstance: Joi.string(),
            created: Joi.date().iso(),
            createdBy: Joi.string(),
            modified: Joi.date().iso(),
            modifiedBy: Joi.string(),
            filename: Joi.string(),
            filesize: Joi.number().integer(),
            uniqueid: Joi.string().allow(''),
            permissions: Joi.array().items(Joi.string()),
            pincount: Joi.number().integer(),
            previewcount: Joi.number().integer(),
            downloadcount: Joi.number().integer(),
            workflowcount: Joi.number().integer(),
            metadataeditcount: Joi.number().integer(),
            revisioncount: Joi.number().integer(),
            doctype: Joi.string().valid('image'),
            previews: Joi.array(),
            quickRenditions: Joi.array(),
            metadataEditor: Joi.object(),
            renditions: Joi.array(),
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
                focalLength: Joi.number().integer(),
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
            props: Joi.object(),
          })),
          paging: Joi.object().keys({
            prev: Joi.string().allow(''),
            next: Joi.string().allow(''),
            first: Joi.string().allow(''),
            last: Joi.string().allow(''),
          }).allow(null),
        };

        const { error } = Joi.validate(res.body, schema);
        assert.ifError(error);

        done();
      });
  });
});
