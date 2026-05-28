import assert from "node:assert/strict";
import test from "node:test";
import {
  getDub,
  getHomeSections,
  getSectionSubjects,
  listDubs,
  listQualities,
  listQualityLabels,
  pickCaption,
  pickVideoFile,
  summarizeHomeSections,
  SubjectType,
  type RootDownloadableFilesDetailModel,
  type RootHomepageModel,
  type RootItemDetailsModel
} from "../src/v3/index.js";

test("v3 home shortcuts summarize and filter homepage sections", () => {
  const homepage: RootHomepageModel = {
    tabId: 0,
    version: "abc",
    trendingTitle: "",
    groupPos: 0,
    ops: {},
    items: [
      {
        type: "BANNER",
        position: 0,
        title: "Banner",
        groups: [],
        subjects: [],
        banner: {
          interval: "5",
          autoPlay: true,
          style: "",
          banners: [
            {
              image: { url: "https://example.test/banner.jpg" } as never,
              content: "",
              deepLink: "",
              opItemId: "",
              subjectId: "1",
              hasResource: true,
              seenStatus: 0
            }
          ]
        },
        icons: [],
        rankings: [],
        opId: "",
        deepLink: "",
        filters: [],
        playListData: null,
        rankingData: null,
        rankingListData: null,
        liveList: [],
        page: null,
        postData: [],
        version: "",
        enableDedup: 0,
        currentPage: 1
      },
      {
        type: "SUBJECTS_MOVIE",
        position: 1,
        title: "Trending",
        groups: [],
        subjects: [
          {
            subjectId: "2",
            title: "Avatar",
            releaseDate: "2009-12-18",
            genre: "Action",
            subjectType: SubjectType.MOVIES,
            cover: { url: "https://example.test/avatar.jpg" } as never
          }
        ],
        banner: null,
        icons: [],
        rankings: [],
        opId: "",
        deepLink: "",
        filters: [],
        playListData: null,
        rankingData: null,
        rankingListData: null,
        liveList: [],
        page: null,
        postData: [],
        version: "",
        enableDedup: 0,
        currentPage: 1
      }
    ]
  };

  assert.deepEqual(
    summarizeHomeSections(homepage).map((section) => [section.title, section.firstPoster]),
    [
      ["Banner", "https://example.test/banner.jpg"],
      ["Trending", "https://example.test/avatar.jpg"]
    ]
  );
  assert.equal(getHomeSections(homepage, { withSubjects: true }).length, 1);
  assert.equal(getSectionSubjects(homepage.items[1]!).at(0)?.title, "Avatar");
});

test("v3 media shortcuts list qualities and pick video files", () => {
  const downloadables: RootDownloadableFilesDetailModel = {
    pager: { hasMore: false, nextPage: 2, page: 1, perPage: 20, totalCount: 3 },
    subjectId: "1",
    subjectType: SubjectType.MOVIES,
    cover: {} as never,
    subjectTitle: "Avatar",
    totalSize: "",
    totalEpisode: 1,
    position: 0,
    resolution: 1080 as never,
    collectionResolutions: [{ resolution: 720 as never, averageSize: "", epNum: 1, requireMemberType: 0, memberIcon: "" }],
    description: "",
    genre: [],
    tags: [],
    favInfo: null,
    releaseDate: "2009-12-18",
    countryName: "",
    durationSeconds: 0,
    list: [
      { title: "low", resolution: 360, resourceId: "low", resourceLink: "https://example.test/low.mp4", episode: 0, linkType: 0, size: 1, uploadBy: "", postId: "", extCaptions: [], se: 0, ep: 0, sourceUrl: "", codecName: "h264", duration: 0, requireMemberType: 0, memberIcon: "" },
      { title: "high", resolution: 1080, resourceId: "high", resourceLink: "https://example.test/high.mp4", episode: 0, linkType: 0, size: 2, uploadBy: "", postId: "", extCaptions: [], se: 0, ep: 0, sourceUrl: "", codecName: "h264", duration: 0, requireMemberType: 0, memberIcon: "" }
    ]
  };

  assert.deepEqual(listQualities(downloadables), [360, 720, 1080]);
  assert.deepEqual(listQualityLabels(downloadables), ["360p", "720p", "1080p"]);
  assert.equal(pickVideoFile(downloadables, "best").resourceId, "high");
  assert.equal(pickVideoFile(downloadables, "360p").resourceId, "low");
});

test("v3 dub and caption shortcuts stay concrete", () => {
  const details = {
    dubs: [
      { subjectId: "1", lanName: "Original Audio", lanCode: "en", original: true, type: 0 },
      { subjectId: "2", lanName: "Hindi dub", lanCode: "hi", original: false, type: 0 }
    ]
  } as RootItemDetailsModel;

  assert.deepEqual(
    listDubs(details).map((dub) => [dub.normalizedName, dub.code, dub.subjectId]),
    [
      ["original", "en", "1"],
      ["hindi", "hi", "2"]
    ]
  );
  assert.equal(getDub(details, "Hindi").subjectId, "2");
  assert.equal(
    pickCaption(
      {
        subjectId: "1",
        extCaptions: [
          { id: "en", lan: "en", lanName: "English", url: "https://example.test/en.srt", size: 1, delay: 0 }
        ]
      },
      "en"
    )?.id,
    "en"
  );
});
