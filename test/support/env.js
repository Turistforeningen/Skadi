'use strict';

process.env.NODE_ENV = 'test';
process.env.CORS_REQUIRE_ORIGIN = 'true';
process.env.CORS_ALLOW_ORIGINS = 'foo.com,bar.com';
process.env.CORS_EXPOSE_HEADERS = 'x-response-time';
