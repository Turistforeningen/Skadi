![Skaði](https://raw.githubusercontent.com/Turistforeningen/Skadi/master/assets/skadi.png "Skaði")

[![Build status](https://app.wercker.com/status/a5d7cda25ff98ed51b343e44fc430a2e/s "wercker status")](https://app.wercker.com/project/bykey/a5d7cda25ff98ed51b343e44fc430a2e)
[![Codacy grade](https://img.shields.io/codacy/grade/71b0ef25650b404894e489ad164ad0ef.svg "Codacy grade")](https://www.codacy.com/app/starefossen/Skadi)
[![Codacy coverage](https://img.shields.io/codacy/coverage/71b0ef25650b404894e489ad164ad0ef.svg "Codacy coverage")](https://www.codacy.com/app/starefossen/Skadi)
[![NPM downloads](https://img.shields.io/npm/dm/Skadi.svg "NPM downloads")](https://www.npmjs.com/package/Skadi)
[![NPM version](https://img.shields.io/npm/v/Skadi.svg "NPM version")](https://www.npmjs.com/package/Skadi)
[![Node version](https://img.shields.io/node/v/skadi.svg "Node version")](https://www.npmjs.com/package/skadi)
[![Dependency status](https://img.shields.io/david/Turistforeningen/Skadi.svg "Dependency status")](https://david-dm.org/Turistforeningen/Skadi)

A semantic cors proxy for the Fotoware / Fotoweb REST API. Making it possible to
integrate Fotoweb with rich client side applications in a swift!

In Norse mythology, Skaði (sometimes anglicized as Skadi, Skade, or Skathi) is a
jötunn and goddess associated with bowhunting, skiing, winter, and mountains.
Skaði is attested in the Poetic Edda, compiled in the 13th century from earlier
traditional sources; the Prose Edda and in Heimskringla, written in the 13th
century by Snorri Sturluson, and in the works of skalds.

```
            "Sleep I could not
            on the sea beds
            for the screeching of the bird.
            That gull wakes me
            when from the wide sea
            he comes each morning.
```

## API v1

### Albums

**Request:**

```
$ curl https://example.com/v1/albums
```

**Response:**

```json
{
  "data": [{
    "id": "5001.AbCd",
    "name": "My First Album",
    "photosUrl": "http://example.com/v1/albums/5001.AbCd/photos",
    ...
  }, {
    "id": "5002.EfGh",
    "name": "My Second Album",
    "photosUrl": "http://example.com/v1/albums/5002.EfGh/photos",
    ...
  }],
  "paging": {...}
}
```

### Photos

**Request:**

```
$ curl https://example.com/v1/albums/{album}/photos
```

**Response:**

```json
{
  "data": [{
    "filename": "_DSC0045_1.JPG",
    "previews": [{...}, {...}, ...],
    "metadata": {20: {...}, 25: {...}, ...],
    ...
  }, {
    "filename": "_DSC0045.JPG",
    "previews": [{...}, {...}, ...],
    "metadata": {20: {...}, 25: {...}, ...],
    ...
  }],
  "paging": {...}
}
```

## Development

### Requirements

* Docker 1.10+
* Docker Compose v1.4+

### Start

```
docker-compose up
```

### Test

```
docker-compose run --rm node npm run test
docker-compose run --rm node npm run lint
```

## [MIT lisenced](https://github.com/Turistforeningen/Skadi/blob/master/LICENSE)
