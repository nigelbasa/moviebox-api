import assert from "node:assert/strict";
import test from "node:test";
import {
  Search,
  SearchV2,
  SubjectType,
  ZeroSearchResultsError,
  type RootSearchResultsModel,
  type RootSearchResultsModelV2
} from "../src/v3/index.js";

class FakeClient {
  constructor(private readonly payload: unknown) {}

  async postToApi<T>(): Promise<T> {
    return structuredClone(this.payload) as T;
  }
}

const pager = {
  hasMore: true,
  nextPage: 2,
  page: 1,
  perPage: 20,
  totalCount: 2
};

test("Search filters by subject type and sanitizes season suffixes", async () => {
  const payload: RootSearchResultsModel = {
    pager,
    verticalRanks: [],
    counts: [],
    subjectType: SubjectType.ALL,
    staffs: [],
    accurate: null,
    items: [
      { subjectId: "1", subjectType: SubjectType.MOVIES, title: "Avatar" },
      { subjectId: "2", subjectType: SubjectType.TV_SERIES, title: "Merlin S2" },
      { subjectId: "3", subjectType: SubjectType.TV_SERIES, title: "Merlin S1" }
    ]
  };

  const search = new Search(new FakeClient(payload) as never, "merlin", {
    subjectType: SubjectType.TV_SERIES
  });

  const result = await search.getContentModel();
  assert.deepEqual(
    result.items.map((item) => item.title),
    ["Merlin"]
  );
});

test("Search throws on empty filtered results", async () => {
  const payload: RootSearchResultsModel = {
    pager,
    verticalRanks: [],
    counts: [],
    subjectType: SubjectType.ALL,
    staffs: [],
    accurate: null,
    items: [{ subjectId: "1", subjectType: SubjectType.MOVIES, title: "Avatar" }]
  };

  const search = new Search(new FakeClient(payload) as never, "avatar", {
    subjectType: SubjectType.TV_SERIES
  });

  await assert.rejects(() => search.getContentModel(), ZeroSearchResultsError);
});

test("SearchV2 flattens first result subjects into items", async () => {
  const payload: RootSearchResultsModelV2 = {
    pager,
    tabId: "All" as never,
    tabs: [],
    items: [],
    results: [
      {
        topicType: "SUBJECT" as never,
        subjects: [
          { subjectId: "1", subjectType: SubjectType.MOVIES, title: "Avatar" }
        ],
        staffs: [],
        groups: [],
        verticalRanks: [],
        title: "Subjects",
        showMore: false
      }
    ]
  };

  const search = new SearchV2(new FakeClient(payload) as never, "avatar", {
    subjectType: SubjectType.MOVIES
  });

  const result = await search.getContentModel();
  assert.equal(result.items[0]?.title, "Avatar");
});
