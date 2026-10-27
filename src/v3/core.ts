import {
  CustomResolutionType,
  RESULTS_PER_PAGE_AMOUNT,
  ResolutionType,
  SubjectType,
  TabID,
  normalizeResolution
} from "./constants.js";
import {
  ExhaustedSearchResultsError,
  ResultsNavigationError,
  ZeroSearchResultsError
} from "./exceptions.js";
import {
  isValidSearchItem,
  sanitizeItemName,
  validatePerPageAndThrow,
  validateSubjectIdOrThrow
} from "./helpers.js";
import { MovieBoxHttpClient } from "./http-client.js";
import type {
  RootCaptionFileMetadata,
  RootDownloadableFilesDetailModel,
  RootHomepageModel,
  RootItemDetailsModel,
  RootSearchResultsModel,
  RootSearchResultsModelV2,
  SeasonsModel,
  VideoFileMetadata
} from "./models.js";
import {
  EXT_CAPTIONS_PATH,
  MAIN_PAGE_PATH,
  RESOURCE_PATH,
  RESOURCE_POSITION_V2_PATH,
  SEARCH_PATH,
  SEARCH_PATH_V2,
  SEASON_INFO_PATH,
  SUBJECT_GET_PATH
} from "./urls.js";

export interface HomepageOptions {
  page?: number;
  tabId?: number | TabID;
  version?: string;
}

export class Homepage {
  private readonly path = MAIN_PAGE_PATH;
  private pageNumber: number;
  private tabId: number | TabID;
  private version: string;

  constructor(
    readonly clientSession: MovieBoxHttpClient,
    options: HomepageOptions = {}
  ) {
    this.pageNumber = options.page ?? 1;
    this.tabId = options.tabId ?? 0;
    this.version = options.version ?? "";
  }

  private createParams(): Record<string, string | number> {
    return {
      page: this.pageNumber,
      tabId: this.tabId,
      version: this.version
    };
  }

  async getContent(): Promise<RootHomepageModel> {
    return this.clientSession.getFromApi<RootHomepageModel>(this.path, {
      params: this.createParams()
    });
  }

  async getContentModel(): Promise<RootHomepageModel> {
    return this.getContent();
  }
}

export interface SearchOptions {
  subjectType?: SubjectType;
  page?: number;
  perPage?: number;
}

export class Search {
  private readonly path = SEARCH_PATH;
  private readonly subjectType: SubjectType;
  private readonly page: number;
  private readonly perPage: number;

  constructor(
    readonly clientSession: MovieBoxHttpClient,
    private readonly query: string,
    options: SearchOptions = {}
  ) {
    this.subjectType = options.subjectType ?? SubjectType.ALL;
    this.page = options.page ?? 1;
    this.perPage = options.perPage ?? RESULTS_PER_PAGE_AMOUNT;
    validatePerPageAndThrow(this.perPage);
  }

  private createPayload(): Record<string, string | number> {
    return {
      keyword: this.query,
      page: this.page,
      perPage: this.perPage,
      subjectType: this.subjectType
    };
  }

  async getContent(): Promise<RootSearchResultsModel> {
    const contents = await this.clientSession.postToApi<RootSearchResultsModel>(
      this.path,
      this.createPayload()
    );

    if (this.subjectType !== SubjectType.ALL) {
      const targetItems = (contents.items ?? [])
        .filter((item) => item.subjectType === this.subjectType)
        .filter((item) => isValidSearchItem(item.title))
        .map((item) => ({ ...item, title: sanitizeItemName(item.title) }));

      contents.items = targetItems;

      if (!targetItems.length) {
        throw new ZeroSearchResultsError(
          "Search yielded empty results. Try a different keyword."
        );
      }
    }

    return contents;
  }

  async getContentModel(): Promise<RootSearchResultsModel> {
    return this.getContent();
  }

  nextPage(content: RootSearchResultsModel): Search {
    if (content.pager.hasMore) {
      return new Search(this.clientSession, this.query, {
        subjectType: this.subjectType,
        page: content.pager.nextPage,
        perPage: this.perPage
      });
    }

    throw new ExhaustedSearchResultsError(
      content.pager,
      "You have already reached the last page of the search results."
    );
  }

  previousPage(content: RootSearchResultsModel): Search {
    if (content.pager.page >= 2) {
      return new Search(this.clientSession, this.query, {
        subjectType: this.subjectType,
        page: content.pager.page - 1,
        perPage: this.perPage
      });
    }

    throw new ResultsNavigationError(
      "Unable to navigate to previous page. Current page is the first one, try navigating to the next one instead."
    );
  }

  async *getContentModelAll(): AsyncGenerator<RootSearchResultsModel> {
    let cursor: Search = this;
    while (true) {
      const contentModel = await cursor.getContentModel();
      yield contentModel;

      if (!contentModel.pager.hasMore) {
        break;
      }
      cursor = cursor.nextPage(contentModel);
    }
  }
}

export interface SearchV2Options extends SearchOptions {
  tabId?: TabID;
}

export class SearchV2 {
  private readonly path = SEARCH_PATH_V2;
  private readonly subjectType: SubjectType;
  private readonly tabId: TabID;
  private readonly page: number;
  private readonly perPage: number;

  constructor(
    readonly clientSession: MovieBoxHttpClient,
    private readonly query: string,
    options: SearchV2Options = {}
  ) {
    this.subjectType = options.subjectType ?? SubjectType.ALL;
    this.tabId = options.tabId ?? TabID.ALL;
    this.page = options.page ?? 1;
    this.perPage = options.perPage ?? RESULTS_PER_PAGE_AMOUNT;
    validatePerPageAndThrow(this.perPage);
  }

  private createPayload(): Record<string, string | number> {
    return {
      keyword: this.query,
      page: this.page,
      perPage: this.perPage,
      subjectType: this.subjectType,
      tabId: this.tabId
    };
  }

  async getContent(): Promise<RootSearchResultsModelV2> {
    const contents = await this.clientSession.postToApi<RootSearchResultsModelV2>(
      this.path,
      this.createPayload()
    );

    const searchResults = contents.results?.[0];
    const sourceItems = searchResults?.subjects ?? [];
    const targetItems =
      this.subjectType === SubjectType.ALL
        ? sourceItems
        : sourceItems
            .filter((item) => item.subjectType === this.subjectType)
            .filter((item) => isValidSearchItem(item.title))
            .map((item) => ({ ...item, title: sanitizeItemName(item.title) }));

    contents.items = targetItems;

    if (!targetItems.length) {
      throw new ZeroSearchResultsError(
        "Search yielded empty results. Try a different keyword."
      );
    }

    return contents;
  }

  async getContentModel(): Promise<RootSearchResultsModelV2> {
    return this.getContent();
  }

  nextPage(content: RootSearchResultsModelV2): SearchV2 {
    if (content.pager.hasMore) {
      return new SearchV2(this.clientSession, this.query, {
        subjectType: this.subjectType,
        tabId: this.tabId,
        page: content.pager.nextPage,
        perPage: this.perPage
      });
    }

    throw new ExhaustedSearchResultsError(
      content.pager,
      "You have already reached the last page of the search results."
    );
  }

  previousPage(content: RootSearchResultsModelV2): SearchV2 {
    if (content.pager.page >= 2) {
      return new SearchV2(this.clientSession, this.query, {
        subjectType: this.subjectType,
        tabId: this.tabId,
        page: content.pager.page - 1,
        perPage: this.perPage
      });
    }

    throw new ResultsNavigationError(
      "Unable to navigate to previous page. Current page is the first one, try navigating to the next one instead."
    );
  }

  async *getContentModelAll(): AsyncGenerator<RootSearchResultsModelV2> {
    let cursor: SearchV2 = this;
    while (true) {
      const contentModel = await cursor.getContentModel();
      yield contentModel;

      if (!contentModel.pager.hasMore) {
        break;
      }
      cursor = cursor.nextPage(contentModel);
    }
  }
}

export class SeasonDetails {
  private readonly path = SEASON_INFO_PATH;

  constructor(readonly clientSession: MovieBoxHttpClient) {}

  async getContent(subjectId: string): Promise<SeasonsModel> {
    validateSubjectIdOrThrow(subjectId);
    return this.clientSession.getFromApi<SeasonsModel>(this.path, {
      params: { subjectId }
    });
  }

  async getContentModel(subjectId: string): Promise<SeasonsModel> {
    return this.getContent(subjectId);
  }
}

export class ItemDetails {
  private readonly path = SUBJECT_GET_PATH;
  private readonly seasonDetails: SeasonDetails;

  constructor(
    readonly clientSession: MovieBoxHttpClient,
    private readonly includeSeasons = false
  ) {
    this.seasonDetails = new SeasonDetails(clientSession);
  }

  async getContent(subjectId: string): Promise<RootItemDetailsModel> {
    validateSubjectIdOrThrow(subjectId);
    const contents = await this.clientSession.getFromApi<RootItemDetailsModel>(
      this.path,
      { params: { subjectId } }
    );

    contents.seasons = this.includeSeasons
      ? await this.seasonDetails.getContent(subjectId)
      : null;

    return contents;
  }

  async getContentModel(subjectId: string): Promise<RootItemDetailsModel> {
    return this.getContent(subjectId);
  }
}

export interface DownloadableVideoFilesDetailOptions {
  page?: number;
  perPage?: number;
  resolution?: ResolutionType | CustomResolutionType | number | string;
}

export class DownloadableVideoFilesDetail {
  private readonly path = RESOURCE_PATH;
  private readonly page: number;
  private readonly perPage: number;
  private readonly resolution: number;

  constructor(
    readonly clientSession: MovieBoxHttpClient,
    options: DownloadableVideoFilesDetailOptions = {}
  ) {
    this.page = options.page ?? 1;
    this.perPage = options.perPage ?? RESULTS_PER_PAGE_AMOUNT;
    this.resolution = normalizeResolution(options.resolution ?? CustomResolutionType.BEST);
    validatePerPageAndThrow(this.perPage);
  }

  private createParams(subjectId: string): Record<string, string | number> {
    validateSubjectIdOrThrow(subjectId);
    return {
      subjectId,
      resolution: this.resolution,
      page: this.page,
      perPage: this.perPage
    };
  }

  async getContent(
    subjectId: string,
    releaseDate?: string
  ): Promise<RootDownloadableFilesDetailModel> {
    const contents = await this.clientSession.getFromApi<RootDownloadableFilesDetailModel>(
      this.path,
      { params: this.createParams(subjectId) }
    );

    if (releaseDate) {
      contents.releaseDate = releaseDate;
    }

    contents.list = await this.unmaskAll(subjectId, contents.list ?? []);
    return contents;
  }

  // The resource endpoint returns a ~0.8 MB decoy clip (macdn.aoneroom.com) as
  // resourceLink for unauthenticated clients. Reporting it as failed through
  // resource-position/v2 yields the real signed CDN link; files whose unmask
  // fails keep the decoy so callers can still see them and filter by size.
  private async unmaskAll(
    subjectId: string,
    files: VideoFileMetadata[]
  ): Promise<VideoFileMetadata[]> {
    return Promise.all(
      files.map(async (file) => {
        if (!file.resourceId || !file.resourceLink) return file;
        try {
          const data = await this.clientSession.getFromApi<{ list?: VideoFileMetadata[] }>(
            RESOURCE_POSITION_V2_PATH,
            {
              params: {
                subjectId,
                resourceId: file.resourceId,
                failUrl: file.resourceLink,
                failCode: "404",
                resourceNum: "0",
                isVip: "true"
              }
            }
          );
          const real = data.list?.[0];
          if (!real?.resourceLink) return file;
          return { ...file, resourceLink: real.resourceLink, size: Number(real.size ?? file.size) };
        } catch {
          return file;
        }
      })
    );
  }

  async getContentModel(
    subjectId: string,
    releaseDate?: string
  ): Promise<RootDownloadableFilesDetailModel> {
    return this.getContent(subjectId, releaseDate);
  }

  nextPage(content: RootDownloadableFilesDetailModel): DownloadableVideoFilesDetail {
    if (content.pager.hasMore) {
      return new DownloadableVideoFilesDetail(this.clientSession, {
        page: content.pager.nextPage,
        perPage: this.perPage,
        resolution: this.resolution
      });
    }

    throw new ExhaustedSearchResultsError(
      content.pager,
      "You have already reached the last page of the search results."
    );
  }

  previousPage(content: RootDownloadableFilesDetailModel): DownloadableVideoFilesDetail {
    if (content.pager.page >= 2) {
      return new DownloadableVideoFilesDetail(this.clientSession, {
        page: content.pager.page - 1,
        perPage: this.perPage,
        resolution: this.resolution
      });
    }

    throw new ResultsNavigationError(
      "Unable to navigate to previous page. Current page is the first one, try navigating to the next one instead."
    );
  }

  async *getContentModelAll(
    subjectId: string
  ): AsyncGenerator<RootDownloadableFilesDetailModel> {
    let cursor: DownloadableVideoFilesDetail = this;
    while (true) {
      const contentModel = await cursor.getContentModel(subjectId);
      yield contentModel;

      if (!contentModel.pager.hasMore) {
        break;
      }
      cursor = cursor.nextPage(contentModel);
    }
  }
}

export const DownloadableFilesDetail = DownloadableVideoFilesDetail;

export class DownloadableCaptionFileDetails {
  private readonly path = EXT_CAPTIONS_PATH;

  constructor(readonly clientSession: MovieBoxHttpClient) {}

  private createParams(
    subjectId: string,
    resource: VideoFileMetadata | string
  ): Record<string, string> {
    validateSubjectIdOrThrow(subjectId);
    return {
      subjectId,
      resourceId: typeof resource === "string" ? resource : resource.resourceId
    };
  }

  async getContent(
    subjectId: string,
    resource: VideoFileMetadata | string
  ): Promise<RootCaptionFileMetadata> {
    return this.clientSession.getFromApi<RootCaptionFileMetadata>(this.path, {
      params: this.createParams(subjectId, resource)
    });
  }

  async getContentModel(
    subjectId: string,
    resource: VideoFileMetadata | string
  ): Promise<RootCaptionFileMetadata> {
    return this.getContent(subjectId, resource);
  }
}
