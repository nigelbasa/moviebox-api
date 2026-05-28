import assert from "node:assert/strict";
import test from "node:test";
import {
  InvalidDetailPathError,
  ItemDetails,
  Search,
  SubjectType,
  pageUrl,
  validateDetailPath,
  type SearchResultsModel
} from "../src/v2/index.js";

class FakeV2Session {
  public lastParams?: Record<string, unknown>;

  constructor(private readonly payload: unknown) {}

  async postToApi<T>(): Promise<T> {
    return structuredClone(this.payload) as T;
  }

  async getFromApi<T>(_url: string, params: Record<string, unknown>): Promise<T> {
    this.lastParams = params;
    return structuredClone(this.payload) as T;
  }
}

test("v2 validateDetailPath mirrors upstream accepted detail path shape", () => {
  assert.equal(validateDetailPath("avatar-abcdefghi"), true);
  assert.equal(validateDetailPath("/detail/avatar-abcdefghi"), false);
});

test("v2 ItemDetails accepts item objects and sends detailPath param", async () => {
  const session = new FakeV2Session({
    subject: {
      subjectId: "1",
      subjectType: SubjectType.MOVIES,
      title: "Avatar",
      description: "",
      releaseDate: "2009-01-01",
      duration: 0,
      genre: [],
      cover: {},
      detailPath: "avatar-abcdefghi"
    },
    stars: [],
    resource: {},
    metadata: {},
    isForbid: false,
    watchTimeLimit: 0,
    postList: {}
  });

  await new ItemDetails(session as never).getContent({
    subjectId: "1",
    subjectType: SubjectType.MOVIES,
    title: "Avatar",
    description: "",
    releaseDate: "2009-01-01",
    duration: 0,
    genre: [],
    cover: {} as never,
    detailPath: "avatar-abcdefghi"
  });

  assert.deepEqual(session.lastParams, { detailPath: "avatar-abcdefghi" });
});

test("v2 ItemDetails rejects invalid detail paths", async () => {
  await assert.rejects(
    () => new ItemDetails(new FakeV2Session({}) as never).getContent("bad/path"),
    InvalidDetailPathError
  );
});

test("v2 Search returns typed result payload without CLI involvement", async () => {
  const payload: SearchResultsModel = {
    pager: {
      hasMore: false,
      nextPage: 2,
      page: 1,
      perPage: 24,
      totalCount: 1
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
      }
    ]
  };

  const result = await new Search(new FakeV2Session(payload) as never, "avatar").getContentModel();
  assert.equal(result.items[0]?.title, "Avatar");
  assert.equal(pageUrl(result.items[0]!), "https://h5-api.aoneroom.com/wefeed-h5api-bff/detail?detailPath=avatar-abcdefghi");
});
