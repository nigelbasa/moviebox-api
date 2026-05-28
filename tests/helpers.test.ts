import assert from "node:assert/strict";
import test from "node:test";
import {
  combineUrlPathWithParams,
  getDownloadTvSeriesRequestParams,
  getDubOrThrow,
  normalizeDubName,
  sanitizeItemName,
  validateSubjectId
} from "../src/v3/index.js";

test("combineUrlPathWithParams merges existing and new params", () => {
  assert.equal(
    combineUrlPathWithParams("/path?b=2", { a: 1, b: 3 }),
    "/path?b=3&a=1"
  );
});

test("validateSubjectId matches MovieBox subject ids", () => {
  assert.equal(validateSubjectId("206379412718240440"), true);
  assert.equal(validateSubjectId("123"), false);
});

test("sanitizeItemName removes duplicate season ranges", () => {
  assert.equal(sanitizeItemName("Merlin S1-S5"), "Merlin");
  assert.equal(sanitizeItemName("Merlin S1"), "Merlin");
});

test("getDownloadTvSeriesRequestParams handles offsets and limits", () => {
  const result = getDownloadTvSeriesRequestParams(
    [
      { se: 1, maxEp: 10, allEp: "", resolutions: [] },
      { se: 2, maxEp: 8, allEp: "", resolutions: [] }
    ],
    { season: 1, episode: 9, perPage: 5, limit: 4 }
  );

  assert.deepEqual(result, {
    totalEpisodes: 4,
    requestParams: [
      { offset: 3, page: 2, perPage: 5, limit: 2 },
      { offset: 0, page: 3, perPage: 5, limit: 2 }
    ]
  });
});

test("getDubOrThrow matches normalized dub names and language codes", () => {
  const itemDetails = {
    dubs: [
      { subjectId: "1", lanName: "Original Audio", lanCode: "en", original: true, type: 0 },
      { subjectId: "2", lanName: "Hindi dub", lanCode: "hi", original: false, type: 0 }
    ]
  };

  assert.equal(normalizeDubName("Hindi dub"), "hindi");
  assert.equal(getDubOrThrow(itemDetails as never, "Original").subjectId, "1");
  assert.equal(getDubOrThrow(itemDetails as never, "Hindi").subjectId, "2");
  assert.equal(getDubOrThrow(itemDetails as never, "hi").subjectId, "2");
});
