import { SubjectType } from "./constants.js";
import {
  ExhaustedSearchResultsError,
  MovieboxApiException,
  ZeroSearchResultsError
} from "./exceptions.js";
import {
  getAbsoluteUrl,
  isValidSearchItem,
  sanitizeItemName,
  validateItemPageUrl
} from "./helpers.js";
import type {
  HomepageContentModel,
  HotMoviesAndTVSeriesModel,
  PopularSearchModel,
  SearchResultsItem,
  SearchResultsModel,
  SuggestedItemsModel,
  TrendingResultsModel
} from "./models.js";
import { pageUrl } from "./models.js";
import { Session } from "./session.js";

export class Homepage {
  protected url = getAbsoluteUrl("/wefeed-h5-bff/web/home");

  constructor(protected readonly session: Session) {}

  async getContent(): Promise<HomepageContentModel> {
    return this.session.getFromApi<HomepageContentModel>(this.url);
  }

  async getContentModel(): Promise<HomepageContentModel> {
    return this.getContent();
  }
}

abstract class BaseSearch<TContent> {
  protected abstract url: string;

  constructor(protected readonly session: Session) {}

  protected abstract createPayload(): Record<string, string | number | boolean | null | undefined>;

  async getContent(): Promise<TContent> {
    return this.session.getWithCookiesFromApi<TContent>(this.url, this.createPayload());
  }

  getItemDetails(item: SearchResultsItem): MovieDetails | TVSeriesDetails {
    if (item.subjectType === SubjectType.MOVIES) {
      return new MovieDetails(item, this.session);
    }
    if (item.subjectType === SubjectType.TV_SERIES) {
      return new TVSeriesDetails(item, this.session);
    }
    throw new Error(
      `Currently only items of ${SubjectType.MOVIES} and ${SubjectType.TV_SERIES} subject types are supported.`
    );
  }
}

export interface SearchOptions {
  subjectType?: SubjectType;
  page?: number;
  perPage?: number;
}

export class Search extends BaseSearch<SearchResultsModel> {
  protected url = getAbsoluteUrl("/wefeed-h5-bff/web/subject/search");
  private readonly subjectType: SubjectType;
  private readonly page: number;
  private readonly perPage: number;

  constructor(session: Session, private readonly query: string, options: SearchOptions = {}) {
    super(session);
    this.subjectType = options.subjectType ?? SubjectType.ALL;
    this.page = options.page ?? 1;
    this.perPage = options.perPage ?? 24;
  }

  protected createPayload(): Record<string, string | number> {
    return {
      keyword: this.query,
      page: this.page,
      perPage: this.perPage,
      subjectType: this.subjectType
    };
  }

  override async getContent(): Promise<SearchResultsModel> {
    const contents = await this.session.postToApi<SearchResultsModel>(
      this.url,
      this.createPayload()
    );

    if (this.subjectType !== SubjectType.ALL) {
      if (!contents.items.length) {
        throw new ZeroSearchResultsError(
          "Search yielded empty results. Try a different keyword."
        );
      }

      contents.items = contents.items
        .filter((item) => item.subjectType === this.subjectType)
        .filter((item) => isValidSearchItem(item.title))
        .map((item) => ({ ...item, title: sanitizeItemName(item.title) }));
    }

    return contents;
  }

  async getContentModel(): Promise<SearchResultsModel> {
    return this.getContent();
  }

  nextPage(content: SearchResultsModel): Search {
    if (content.pager.hasMore) {
      return new Search(this.session, this.query, {
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

  previousPage(content: SearchResultsModel): Search {
    if (content.pager.page >= 2) {
      return new Search(this.session, this.query, {
        subjectType: this.subjectType,
        page: content.pager.page - 1,
        perPage: this.perPage
      });
    }
    throw new MovieboxApiException(
      "Unable to navigate to previous page. Current page is the first one try navigating to the next one instead."
    );
  }
}

export class Trending extends BaseSearch<TrendingResultsModel> {
  protected url = getAbsoluteUrl("/wefeed-h5-bff/web/subject/trending");

  constructor(
    session: Session,
    private readonly page = 0,
    private readonly perPage = 18
  ) {
    super(session);
  }

  protected createPayload(): Record<string, number> {
    return { page: this.page, perPage: this.perPage };
  }

  async getContentModel(): Promise<TrendingResultsModel> {
    return this.getContent();
  }

  nextPage(content: TrendingResultsModel): Trending {
    if (content.pager.hasMore) {
      return new Trending(this.session, content.pager.nextPage, this.perPage);
    }
    throw new ExhaustedSearchResultsError(
      content.pager,
      "You have already reached the last page of the search results."
    );
  }

  previousPage(content: TrendingResultsModel): Trending {
    if (content.pager.page >= 1) {
      return new Trending(this.session, content.pager.page - 1, this.perPage);
    }
    throw new MovieboxApiException(
      "Unable to navigate to previous page. Current page is the first one try navigating to the next one instead."
    );
  }
}

export class Recommend extends BaseSearch<SearchResultsModel> {
  protected url = getAbsoluteUrl("/wefeed-h5-bff/web/subject/detail-rec");

  constructor(
    session: Session,
    private readonly item: SearchResultsItem,
    private readonly page = 1,
    private readonly perPage = 24
  ) {
    super(session);
  }

  protected createPayload(): Record<string, string | number> {
    return {
      page: this.page,
      subjectId: this.item.subjectId,
      perPage: this.perPage
    };
  }

  override async getContent(): Promise<SearchResultsModel> {
    const content = await super.getContent();
    content.pager = {
      hasMore: Boolean(content.items?.length),
      nextPage: this.page + 1,
      page: this.page,
      perPage: this.perPage,
      totalCount: 0
    };
    return content;
  }

  async getContentModel(): Promise<SearchResultsModel> {
    return this.getContent();
  }
}

export class HotMoviesAndTVSeries extends BaseSearch<HotMoviesAndTVSeriesModel> {
  protected url = getAbsoluteUrl("/wefeed-h5-bff/web/subject/search-rank");

  protected createPayload(): Record<string, never> {
    return {};
  }

  async getContentModel(): Promise<HotMoviesAndTVSeriesModel> {
    return this.getContent();
  }
}

export class PopularSearch {
  protected url = getAbsoluteUrl("/wefeed-h5-bff/web/subject/everyone-search");

  constructor(private readonly session: Session) {}

  async getContent(): Promise<PopularSearchModel[]> {
    const content = await this.session.getWithCookiesFromApi<{ everyoneSearch: PopularSearchModel[] }>(
      this.url
    );
    return content.everyoneSearch;
  }

  async getContentModel(): Promise<PopularSearchModel[]> {
    return this.getContent();
  }
}

export class SearchSuggestion {
  protected url = getAbsoluteUrl("/wefeed-h5-bff/web/subject/search-suggest");

  constructor(private readonly session: Session, private readonly perPage = 10) {}

  async getContent(reference: string): Promise<SuggestedItemsModel> {
    return this.session.postToApi<SuggestedItemsModel>(this.url, {
      per_page: this.perPage,
      keyword: reference
    });
  }

  async getContentModel(reference: string): Promise<SuggestedItemsModel> {
    return this.getContent(reference);
  }
}

export class BaseItemDetails {
  private htmlContent?: string;
  protected readonly url: string;

  constructor(pageUrlValue: string, protected readonly session: Session) {
    this.url = validateItemPageUrl(pageUrlValue);
  }

  async getHtmlContent(): Promise<string> {
    if (this.htmlContent !== undefined) {
      return this.htmlContent;
    }

    const response = await this.session.getWithCookies(getAbsoluteUrl(this.url));
    this.htmlContent = await response.text();
    return this.htmlContent;
  }

  async getContent(): Promise<Record<string, unknown>> {
    throw new Error(
      "v1 HTML JSON extraction is not ported yet. Use getHtmlContent() for the raw page."
    );
  }

  async getContentModel(): Promise<Record<string, unknown>> {
    return this.getContent();
  }
}

export class MovieDetails extends BaseItemDetails {
  constructor(urlOrItem: string | SearchResultsItem, session: Session) {
    const resolved =
      typeof urlOrItem === "string" ? urlOrItem : pageUrl(assertSubject(urlOrItem, SubjectType.MOVIES));
    super(resolved, session);
  }
}

export class TVSeriesDetails extends BaseItemDetails {
  constructor(urlOrItem: string | SearchResultsItem, session: Session) {
    const resolved =
      typeof urlOrItem === "string"
        ? urlOrItem
        : pageUrl(assertSubject(urlOrItem, SubjectType.TV_SERIES));
    super(resolved, session);
  }
}

function assertSubject(item: SearchResultsItem, subjectType: SubjectType): SearchResultsItem {
  if (item.subjectType !== subjectType) {
    throw new Error(`item needs to be of subjectType ${subjectType} not ${item.subjectType}`);
  }
  return item;
}
