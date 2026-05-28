import { SubjectType, SINGLE_ITEM_SUBJECT_TYPES } from "./constants.js";
import { ExhaustedSearchResultsError, InvalidDetailPathError } from "./exceptions.js";
import { getAbsoluteUrl, validateDetailPath } from "./helpers.js";
import type {
  HomepageContentModel,
  SearchResultsItem,
  SearchResultsModel,
  SpecificItemDetailsModel
} from "./models.js";
import { Session } from "./session.js";

export class Homepage {
  protected url = getAbsoluteUrl("/wefeed-h5api-bff/home?host=moviebox.ph");

  constructor(protected readonly session: Session) {}

  async getContent(): Promise<HomepageContentModel> {
    return this.session.getFromApi<HomepageContentModel>(this.url);
  }

  async getContentModel(): Promise<HomepageContentModel> {
    return this.getContent();
  }
}

export class SearchSuggestion {
  protected url = getAbsoluteUrl("/wefeed-h5api-bff/subject/search-suggest");

  constructor(private readonly session: Session, private readonly perPage = 10) {}

  async getContent(reference: string): Promise<unknown> {
    return this.session.postToApi(this.url, {
      per_page: this.perPage,
      keyword: reference
    });
  }

  async getContentModel(reference: string): Promise<unknown> {
    return this.getContent(reference);
  }
}

export interface SearchOptions {
  subjectType?: SubjectType;
  page?: number;
  perPage?: number;
}

export class Search {
  protected url = getAbsoluteUrl("/wefeed-h5api-bff/subject/search");
  private readonly subjectType: SubjectType;
  private readonly page: number;
  private readonly perPage: number;

  constructor(
    protected readonly session: Session,
    private readonly query: string,
    options: SearchOptions = {}
  ) {
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

  async getContent(): Promise<SearchResultsModel> {
    return this.session.postToApi<SearchResultsModel>(this.url, this.createPayload());
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
    throw new Error(
      "Unable to navigate to previous page. Current page is the first one try navigating to the next one instead."
    );
  }

  getItemDetails(_item: SearchResultsItem): never {
    throw new Error("getItemDetails is only available in v1.");
  }
}

export class ItemDetails {
  protected apiEndpoint = getAbsoluteUrl("/wefeed-h5api-bff/detail");

  constructor(protected readonly session: Session) {}

  protected validateDetailPath(detailPath: string): void {
    if (!validateDetailPath(detailPath)) {
      throw new InvalidDetailPathError(
        `Invalid detail path passed ${JSON.stringify(detailPath)} Recheck and try again`
      );
    }
  }

  async getContent(pathOrItem: string | SearchResultsItem): Promise<SpecificItemDetailsModel> {
    const detailPath =
      typeof pathOrItem === "string" ? pathOrItem : pathOrItem.detailPath;
    this.validateDetailPath(detailPath);
    return this.session.getFromApi<SpecificItemDetailsModel>(this.apiEndpoint, {
      detailPath
    });
  }

  async getContentModel(pathOrItem: string | SearchResultsItem): Promise<SpecificItemDetailsModel> {
    return this.getContent(pathOrItem);
  }
}

export class SingleItemDetails extends ItemDetails {
  override async getContent(pathOrItem: string | SearchResultsItem): Promise<SpecificItemDetailsModel> {
    if (typeof pathOrItem !== "string" && !SINGLE_ITEM_SUBJECT_TYPES.has(pathOrItem.subjectType)) {
      throw new Error(
        `item needs to be one of single item subject types not ${pathOrItem.subjectType}`
      );
    }
    return super.getContent(pathOrItem);
  }
}

export const MusicDetails = SingleItemDetails;
export const AnimeDetails = SingleItemDetails;
export const EducationDetails = SingleItemDetails;
export const MovieDetails = SingleItemDetails;

export class TVSeriesDetails extends ItemDetails {
  override async getContent(pathOrItem: string | SearchResultsItem): Promise<SpecificItemDetailsModel> {
    if (typeof pathOrItem !== "string" && pathOrItem.subjectType !== SubjectType.TV_SERIES) {
      throw new Error(
        `item needs to be of subjectType ${SubjectType.TV_SERIES} only not ${pathOrItem.subjectType}`
      );
    }
    return super.getContent(pathOrItem);
  }
}
