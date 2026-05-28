# moviebox-api-ts

Unofficial TypeScript port of the Python [`moviebox-api`](https://github.com/nigelbasa/moviebox-api) package.

This first milestone ports the library surface for the Python package's three API generations:

- `v3`: signed requests, host fallback, homepage content, search, item details, season details, downloadable media metadata, caption metadata, and pagination helpers.
- `v2`: web API session, homepage, search, item details, detail-path validation, and typed response shapes.
- `v1`: web API session, homepage, search/discovery providers, raw item page fetching, and downloadable metadata helpers.

Full v1 HTML detail extraction, streaming ergonomics, and CLI are intentionally left as follow-up work so the TypeScript package stays clean and testable.

## Install

```sh
npm install
npm run build
```

## Library Usage

```ts
import { MovieBoxHttpClient, Search, SubjectType } from "moviebox-api-ts/v3";

const client = new MovieBoxHttpClient();
const search = new Search(client, "Avatar", {
  subjectType: SubjectType.MOVIES
});

const results = await search.getContentModel();
console.log(results.items[0]?.title);
```

```ts
import { Search, Session, SubjectType } from "moviebox-api-ts/v2";

const session = new Session();
const results = await new Search(session, "Avatar", {
  subjectType: SubjectType.MOVIES
}).getContentModel();
```

## Focused Helpers

The helper layer stays close to the raw API objects:

```ts
import {
  getDownloadablesForDub,
  listDubs,
  listQualityLabels,
  pickVideoFile
} from "moviebox-api-ts/v3";

const dubs = listDubs(details);
const files = await getDownloadablesForDub(client, details, "Hindi");
const qualities = listQualityLabels(files);
const video = pickVideoFile(files, "1080p");
```

For homepage data, use `summarizeHomeSections` in `v3` or `summarizeHomeRows` in `v2` to inspect rows without hiding the original response.

## Environment

- `MOVIEBOX_SECRET_KEY_DEFAULT`
- `MOVIEBOX_SECRET_KEY_ALT`
- `MOVIEBOX_AUTH_TOKEN`

These match the upstream Python package environment knobs.
