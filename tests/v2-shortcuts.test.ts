import assert from "node:assert/strict";
import test from "node:test";
import {
  findHomeRow,
  getHomeRows,
  getRowBannerItems,
  getRowDrilldownParams,
  getRowSubjects,
  summarizeHomeRows,
  SubjectType,
  type HomepageContentModel
} from "../src/v2/index.js";

test("v2 home shortcuts expose rows, row items, and drilldown ids", () => {
  const homepage: HomepageContentModel = {
    platformList: [],
    operatingList: [
      {
        type: "BANNER",
        position: 0,
        title: "Banner",
        subjects: [],
        opId: "",
        url: "",
        filters: [],
        customData: null,
        genreTopId: "",
        detailPath: "",
        banner: {
          items: [
            {
              id: "b",
              title: "Hero",
              image: { url: "https://example.test/hero.jpg" } as never,
              subjectId: "1",
              subjectType: SubjectType.MOVIES,
              detailPath: "hero-abcdefghi"
            } as never
          ]
        }
      },
      {
        type: "SUBJECTS_MOVIE",
        position: 1,
        title: "Action Movies",
        subjects: [
          {
            subjectId: "2",
            subjectType: SubjectType.MOVIES,
            title: "Avatar",
            description: "",
            releaseDate: "2009-12-18",
            duration: 0,
            genre: "Action",
            cover: { url: "https://example.test/avatar.jpg" } as never,
            detailPath: "avatar-abcdefghi"
          }
        ],
        opId: "",
        url: "",
        filters: [{ label: "Action" }],
        customData: null,
        genreTopId: "genre-1",
        detailPath: "action-abcdefghi"
      }
    ]
  };

  assert.deepEqual(
    summarizeHomeRows(homepage).map((row) => [row.title, row.firstPoster]),
    [
      ["Banner", "https://example.test/hero.jpg"],
      ["Action Movies", "https://example.test/avatar.jpg"]
    ]
  );
  assert.equal(getHomeRows(homepage, { withSubjects: true }).length, 1);
  assert.equal(findHomeRow(homepage, "action movies")?.title, "Action Movies");
  assert.equal(getRowSubjects(homepage.operatingList[1]!).at(0)?.title, "Avatar");
  assert.equal(getRowBannerItems(homepage.operatingList[0]!).at(0)?.title, "Hero");
  assert.deepEqual(getRowDrilldownParams(homepage.operatingList[1]!), {
    detailPath: "action-abcdefghi",
    genreTopId: "genre-1"
  });
});
