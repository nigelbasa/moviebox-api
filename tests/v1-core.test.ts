import assert from "node:assert/strict";
import test from "node:test";
import {
  Search,
  SubjectType,
  pageUrl,
  bestMediaFile,
  englishSubtitleFile,
  type SearchResultsModel
} from "../src/v1/index.js";

class FakeV1Session {
  constructor(private readonly payload: unknown) {}

  async postToApi<T>(): Promise<T> {
    return structuredClone(this.payload) as T;
  }
}

test("v1 Search filters target subject type and keeps S1 titles", async () => {
  const payload: SearchResultsModel = {
    pager: {
      hasMore: false,
      nextPage: 2,
      page: 1,
      perPage: 24,
      totalCount: 3
    },
    items: [
      {
        subjectId: "1",
        subjectType: SubjectType.MOVIES,
        title: "Avatar",
        description: "",
        releaseDate: "2009-01-01",
        duration: 0,
        genre: [],
        cover: {} as never,
        detailPath: "avatar-abcdefghi"
      },
      {
        subjectId: "2",
        subjectType: SubjectType.TV_SERIES,
        title: "Merlin S2",
        description: "",
        releaseDate: "2009-01-01",
        duration: 0,
        genre: [],
        cover: {} as never,
        detailPath: "merlin-abcdefghi"
      },
      {
        subjectId: "3",
        subjectType: SubjectType.TV_SERIES,
        title: "Merlin S1",
        description: "",
        releaseDate: "2009-01-01",
        duration: 0,
        genre: [],
        cover: {} as never,
        detailPath: "merlin-abcdefghi"
      }
    ]
  };

  const search = new Search(new FakeV1Session(payload) as never, "merlin", {
    subjectType: SubjectType.TV_SERIES
  });

  const result = await search.getContentModel();
  assert.deepEqual(
    result.items.map((item) => item.title),
    ["Merlin"]
  );
});

test("v1 model helpers expose page URLs and downloadable shortcuts", () => {
  assert.equal(
    pageUrl({
      subjectId: "206379412718240440",
      subjectType: SubjectType.MOVIES,
      title: "Avatar",
      description: "",
      releaseDate: "2009-01-01",
      duration: 0,
      genre: [],
      cover: {} as never,
      detailPath: "avatar-abcdefghi"
    }),
    "/detail/avatar-abcdefghi?id=206379412718240440"
  );

  const downloadable = {
    downloads: [
      { id: "a", url: "https://example.test/a.mp4?x=1", resolution: 480, size: 1 },
      { id: "b", url: "https://example.test/b.mp4?x=1", resolution: 1080, size: 2 }
    ],
    captions: [
      { id: "c", lan: "en", lanName: "English", url: "https://example.test/c.srt?x=1", size: 3, delay: 0 }
    ],
    limited: false,
    limitedCode: "",
    hasResource: true
  };

  assert.equal(bestMediaFile(downloadable).id, "b");
  assert.equal(englishSubtitleFile(downloadable)?.id, "c");
});
